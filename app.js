const fs = require('fs');
const path = require('path');
const uuid = require('node-uuid');
const cheerio = require('cheerio');
const parser = require('./parser');

const ING_LINE_CHARACTER_LIMIT = 110;
const ING_CHARACTER_LIMIT = 30;

const importPath = path.join(__dirname, 'data/import/');
const outputPath = path.join(__dirname, 'data/output/');

// read all non-hidden files
const files = fs.readdirSync(importPath).filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));

const copyFile = (source, target, cb) => {
  let cbCalled = false;

  let rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  let wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
};

const sanitizeEncoding = (line) => {
  line = line.trim();
  //reduce multiple spaces to a single space
  line = line.replace(/ +(?= )/g, ' ');

	for (let ci = 0; ci < line.length; ci++) {
    let char = line.charCodeAt(ci);
    if (char >= 128) {
    	switch(char) {
    		case 160:
    			line = line.substr(0, ci) + ' ' + line.substr(ci + 1);
    			break;
    		case 8260:
    			line = line.substr(0, ci) + '/' + line.substr(ci + 1);
    			break;
    		case (8211 || 8212):
    			line = line.substr(0, ci) + '-' + line.substr(ci + 1);
    			break;
    		case (233 || 232):
    			line = line.substr(0, ci) + 'e' + line.substr(ci + 1);
    			break;
    		case 241:
    			line = line.substr(0, ci) + 'n' + line.substr(ci + 1);
    			break;
    		case 224:
    			line = line.substr(0, ci) + 'a' + line.substr(ci + 1);
    			break;
    		case 249:
    			line = line.substr(0, ci) + 'u' + line.substr(ci + 1);
    			break;
    		default:
    			line = line.substr(0, ci) + '' + line.substr(ci + 1);
    			break;
    	}
    }
  }

  return line;
};

const parseRecipe = (file, id) => {
	let ingredients = [];
	let instructions = [];
	let source;

	$ = cheerio.load(fs.readFileSync(importPath + file));
	let depth = $('div').find('div').length;
  let level = $('div');

  // make sure we're at the root level of our recipe
  if (depth !== 0) {
    level = $('div').find('div');
  }

  // go through the recipe contents
  level.each(function(i, elem) {
    let line = $(this).text();

    //strip out weird characters and fix our silent alt-space
    line = sanitizeEncoding(line);

    if (line !== undefined && line.length > 0) {

    	if (line.length < ING_LINE_CHARACTER_LIMIT) {
    		let parsed = false;
    		let ingredientObject;
    		
    		try {
    			ingredientObject = parser.parse(line.toLowerCase());
    			parsed = true;
    		} catch (ex) {
    			//console.log(ex.message); // peg error
    			// TODO collect error messages for review
    			instructions.push(line);
    		}

    		if (parsed) {
    			ingredientObject.ref = line;

    			//check for valid ingredients
    			ingredientObject.ingredient.forEach((ing, index) => {
    				const ingredientDB = fs.readFileSync('./ingredients.json', 'utf-8');

    				// if its a valid ingredient then go ahead and accept the ingredient line
						if (ingredientDB.includes(ing)) {
    					ingredientObject.ingredient[index] = { name: ing, validated: true };
						} else {
						// if this is an unverified ingredient check 
							if (ing.length > ING_CHARACTER_LIMIT) {
	    					parsed = false;
	    				} else {
	    					//flag this new ingredient as unverified
	    					ingredientObject.ingredient[index] = { name: ing, validated: false };
    						
    						const pendingDB = fs.readFileSync('./pendingIngredients.json', 'utf-8');

	              if (!pendingDB.includes(ing)) {
	              	let data = JSON.parse(pendingDB);	
		              data.push({ ingredient: ing });

		              fs.writeFileSync('./pendingIngredients.json', JSON.stringify(data, null, 2), 'utf8', function (err) {
								    if (err) return console.log(err);
								  });
	              }
	    				}
    				}
    			});

    			if (!parsed) {
    				instructions.push(line);
    			} else {
						ingredients.push(ingredientObject);
    			}
    		}

    	} else {
    		instructions.push(line);
    	}
    } 
	});

	// lookup the source-url from the meta tags
	const meta = $('meta')
  const keys = Object.keys(meta)

  keys.forEach(function(key){
    if (meta[key].attribs && meta[key].attribs.name && meta[key].attribs.name === 'source-url') {
	    source = meta[key].attribs.content;
    }
  });

  // lookup image if available
  let imgFormat;
  if ($('img').attr('src') !== undefined) {
  	imgFormat = $('img').attr('src').split('.').pop();
  }

	return {
		title: $('title').text(),
		source: source,
		ingredients: ingredients,
		instructions: instructions,
		imgPath: (imgFormat) ? id + '.' + imgFormat : null
	};
};

const importHtml = (file, id) => {
	return new Promise((resolve, reject) => {
		fs.readFile(importPath + file, 'utf-8', (err, data) => {
			if (err) return reject(err);

			//parse file
			const parsed = parseRecipe(file, id);

			const recipe = {
				id: id,
				title: parsed.title,
				source: parsed.source,
				ingredients: parsed.ingredients,
				instructions: parsed.instructions,
				imgPath: parsed.imgPath
			};

			resolve(recipe, file);
		});
	})
};

const importImg = (imgPath, img, id, index) => {
	return new Promise((resolve, reject) => {
		//console.log('INPUT - ' + imgPath + img);
		//console.log('OUTPUT - '+ outputPath + ('images/' + id + ((index) ? '-' + index : null)));
		// rename image and move it to the output
    copyFile(imgPath + '/' + img, outputPath + ('images/' + id + ((index) ? '-' + index : '')), (err) => {
      if (err) return reject(err);
      
	    resolve();
    });
	})
};

let pendingContent = [];
let pendingImages = [];

files.forEach(file => {
	const filePath = path.join(importPath, file);
	const fileType = filePath.split('.').pop();
	const filename = filePath.split('.' + fileType)[0];
	let id;

	if (fileType === 'html') {
		// determine if we've imported this recipe's img data yet or not
		const imgImported = pendingImages.filter(img => img.path.includes(filename));

		// if we've already imported the image, use it's ID
		if (imgImported.length > 0) {
			id = imgImported[0].id;
		} else {
			// otherwise create a new id and add it to the pendingContent array
			id = uuid.v1();
			pendingContent.push({ id: id, path: filename});
		}

		importHtml(file, id)
			.then((recipe, data) => {
				console.log('🍕 finished parsing: ' + recipe.title);
				fs.writeFileSync('./data/output/' + id + '.json', JSON.stringify(recipe, null, 2), 'utf8', function (err) {
			    if (err) return console.log(err);
			  });
			})
			.then(data => {
				//copy original to archive
				//console.log('archiving file');
			})
			.then(data => {
				//remove file
				//console.log('removing file');
			})
			.catch(console.error);
	}
		
	if (fileType === 'resources') {
		// determine if we've imported this recipe's content data yet or not
		const contentImported = pendingContent.filter(data => data.path.includes(filename));

		// if we've already imported the content, use it's ID
		if (contentImported.length > 0) {
			id = contentImported[0].id;
		} else {
			// otherwise create a new id and add it to the pendingContent array
			id = uuid.v1();
			pendingImages.push({ id: id, path: filename });
		}

		const images = fs.readdirSync(importPath + file);

		images.forEach((img, index) => {
			importImg(importPath + file, img, id, index);
			console.log('📷 finished importing: ' + file);
		});

	}
		
});

