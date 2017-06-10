const fs = require('fs');
const path = require('path');
const uuid = require('node-uuid');
const cheerio = require('cheerio');
const parser = require('./parser');

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

const removeDirectoryContents = (path) => {
  if ( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach((file, index) => {
      const curPath = path + "/" + file;

      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        removeDirectoryContents(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });

    fs.rmdirSync(path);
  }
};

const sanitizeEncoding = (line) => {
  line = line.trim();
  //reduce multiple spaces to a single space
  line = line.replace(/ +(?= )/g, ' ');

  //substitute known wonky and accented characters
	for (let ci = 0; ci < line.length; ci++) {
    let char = line.charCodeAt(ci);
    if (char >= 128) {
    	switch(char) {
    		case 160: //(╯°□°）╯︵ ┻━┻
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
  let imgFormat;

  // load our file into cheerio so we can parse the html structure
	$ = cheerio.load(fs.readFileSync(importPath + file));
	let depth = $('div').find('div').length;
  let level = $('div');

  // make sure we're at the root level of our recipe
  // some older notes still have weird formatting that causes a slightly different rendered html structure
  if (depth !== 0) {
    level = $('div').find('div');
  }

  let recipeArray = [];
  let childArray = [];

  const body = $('body').children();

  // our running assumption wil be that instructions will be on a single line, whereas ingredients will be blocked together:

  // ing
  // ing
  // ing
  //
  // ing
  // ing
  // ing
  //
  // instr
  //
  // instr
  //
  // instr

  // loop through our DOM elements and create a 2D array that hold groups of lines separated by <br/> tags
  // each array inside this array should contain a group of ingredients or a single instruction line

  // ex: [ [ing, ing, ing], [ing, ing, ing], [instr], [instr], [instr]]

  body.map((i, el) => {
  	el.children.map((child) => {
  		if (child.name === 'br') {
  			childArray = [];
  			recipeArray.push(childArray);
  		} else if (child.data !== undefined && child.data.trim().length > 0) {
        childArray.push(child.data.replace(/\s+/g,' ').trim());
  		}

      //check for deeper nesting
      if (child.children !== undefined) {
        if (child.children[0] !== undefined) {
          if (child.children[0].name === 'br') {
            childArray = [];
            recipeArray.push(childArray);
          } else if (child.children[0].data !== undefined && child.children[0].data.trim().length > 0) {
            childArray.push(child.children[0].data.replace(/\s+/g,' ').trim());
          }
        }
      }
  	});
  });

  // now lets loop through our recipeArray and any inner array with a length > 1 we'll try to parse out into an ingredientObject
  for (let index in recipeArray) {
  	let block = recipeArray[index];

  	// parse as ingredient
  	if (block.length > 1) {
  		let blockIngredients = block.map((line, lineNum) => {
        // clean up known weird characters that the parser might choke on
  			line = sanitizeEncoding(line);

    		let ingredientObject;

        // attempt to parse the ingredient line...
    		try {
    			ingredientObject = parser.parse(line.toLowerCase());
          ingredientObject.block = parseInt(index, 10); //preserve what ingredient group it's in
          ingredientObject.order = lineNum;
    			ingredientObject.ref = line; //preserve the the unparsed line reference
    			ingredientObject.parsed = true;

    			// check for valid ingredients
    			ingredientObject.ingredient.names.forEach((ing, index) => {
            // open up our fake db connection to our known valid ingredients
    				const ingredientDB = fs.readFileSync('./db/ingredients.json', 'utf-8');

						if (ingredientDB.includes(ing)) {
              // TODO assign ingredient keys to that data store
              // we'll just slap a unique id on it for the time being so the front end has something unique to work with for keys
    					ingredientObject.ingredient.names[index] = { ingredient_id: uuid.v1(), name: ing, validated: true };
						} else {
    					// if we didn't find this pre-approved ingredient, flag it as unverified
    					ingredientObject.ingredient.names[index] = { ingredient_id: uuid.v1(), name: ing, validated: false };

              // open up our fake db connection to our unknown ingredient list
  						const pendingDB = fs.readFileSync('./db/pendingIngredients.json', 'utf-8');
              let data = JSON.parse(pendingDB);

              // check to see if we've seen this unknown ingredient before in other recipes
              // and either insert it if its new, or bump up the count if we've encountered this in other recipes

              if (!pendingDB.includes(ing)) {
	              data.push({ ingredient: ing, count: 0, recipes: [id], ref: [line] });
	            } else {
	            	// update count
	            	for (let d in data) {
	            		if (data[d].ingredient === ing) {
	            			data[d].count += 1;
	            			let recipes = data[d].recipes;
	            			recipes.push(id);
	            			let ref = data[d].ref;
	            			ref.push(line);

	            			data[d].recipes = recipes;
	            			data[d].ref = ref;
	            		}
	            	}
	            }

              // and re-save our fake database
              fs.writeFileSync('./db/pendingIngredients.json', JSON.stringify(data, null, 2), 'utf8', function (err) {
						    if (err) return console.log(err);
						  });

    				}
    			});
    		} catch (ex) {
          //if the parser fell over for whatever reason, we'll flag this ingredient line as unparsed
    			ingredientObject = {
            block: parseInt(index, 10),
            order: lineNum,
    				ref: line,
    				parsed: false
    			}

          // open up a fake db connection to our running list of parser fuck ups
          const errorsDB = fs.readFileSync('./db/parsingErrors.json', 'utf-8');
          let data = JSON.parse(errorsDB);

          // TODO add a count to the pending ingredients so we know how often these phrases occur

          data.push({ ref: line, id: id });

          // and re-save the file so we can reference what kinds of sentence structures don't get parsed
          fs.writeFileSync('./db/parsingErrors.json', JSON.stringify(data, null, 2), 'utf8', function (err) {
            if (err) return console.log(err);
          });
    		}

  			return ingredientObject;
  		});

      // add our ingredient object to the current block in this recipe
  		ingredients.push(blockIngredients);
  	} else {
      // if we're not in a block, then we'll just assume its an instruction
      if (block[0] !== undefined) {
        instructions.push(block[0]);
      }
  	}
  }

  // flatten our ingredients array
  ingredients = [].concat.apply([], ingredients);

	// lookup the source-url from the meta tags in the header
	const meta = $('meta');
  const keys = Object.keys(meta);

  keys.forEach(function(key){
    if (meta[key].attribs && meta[key].attribs.name && meta[key].attribs.name === 'source-url') {
	    source = meta[key].attribs.content;
    }
  });

  // lookup image format (the image will get re-nammed with our recipe id so we just need the file format)
  if ($('img').attr('src') !== undefined) {
  	imgFormat = $('img').attr('src').split('.').pop();
  }

  // and hand back our nicely parsed out recipe object
	return {
		title: $('title').text(),
		source: source,
		ingredients: ingredients,
		instructions: instructions,
		imgPath: (imgFormat) ? id + '.' + imgFormat : null
	};
};

// html in, json out
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
		const fileExt = img.split('.').pop();

    // TODO check for the existence of the images directory and if it doesn't exist create it

		// rename image and move it to the output
    copyFile(imgPath + '/' + img, outputPath + ('images/' + id + ((index) ? '-' + index + '.' + fileExt : '.' + fileExt)), (err) => {
      if (err) return reject(err);

	    resolve();
    });
	})
};


// THE FUN STARTS HERE

let pendingContent = [];
let pendingImages = [];

let recipesCollection = [];
let importedCount = 0;

const self = this;

files.forEach((file, index, collection) => {
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
			pendingContent.push({ id: id, path: filename });
		}

		importHtml(file, id)
			.then((recipe, data) => {
				console.log('🍕 finished parsing: ' + recipe.title);
				fs.writeFileSync('./data/output/' + id + '.json', JSON.stringify(recipe, null, 2), 'utf8', function (err) {
			    if (err) return console.log(err);
			  });

			  recipesCollection.push(recipe);
			})
			.then(data => {
				// TODO copy original file to archive

				// remove the file from the import directory
				//console.log('removing file ' + filePath);
				fs.unlinkSync(filePath);
			})
			.then(() => {
        // when we're totally done we'll combine all the recipes into a single json to use as a fake db for the front end
				// generate the master file if we're at the end of our import
				importedCount++;

				if (importedCount === Math.ceil((collection.length) / 2)) {
					// save recipe master
					fs.writeFileSync('./data/output/_master.json', JSON.stringify(recipesCollection, null, 2), 'utf8', function (err) {
				    if (err) return console.log(err);
				  });
				  console.log('💯 wrote master');

				}
			})
			.catch(console.error);
	}

  // if we're handed a dircetory instead of a file then its the associated img data
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
		const numImages = images.length;

		images.forEach((img, index) => {
			importImg(importPath + file, img, id, index)
			.then(() => {
				if (index + 1 === numImages) {
          // TODO archive imgs
					//console.log('removing image directory ' + filePath);
					removeDirectoryContents(filePath);
				}
			})
			.catch(console.error);
			console.log('📷 finished importing: ' + file);
		});
	}

});

