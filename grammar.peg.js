start
  = ingredientLine
  
ingredientLine
  = amount:(amount)? (ws+)?
    ignore?
    unitDesc:multipleUnitDesc
    ignore?
    unit:(unit)? (ws+)?
    ignore?
    container:(container)? (ws+)?
    ignore?
    ingredientDesc:multipleIngredientDesc
    ignore?
    ingredient:(ingredient)
    ignore?
    comment:(comment)? [\n]? {
      return {
        amount: amount,
        unitDesc: unitDesc,
        unit: unit,
        container: container,
        ingredientDesc: ingredientDesc,
        ingredient: ingredient,
        comment: comment
      };
  }
  
multipleIngredientDesc 
 = first:(ingredientDesc)? (ws+)? 
   second:(ingredientDesc)? (ws+)?
   third:(ingredientDesc)? (ws+)?
   { 
     let descriptions = [];
     (first) ? descriptions.push(first) : null;
     (second) ? descriptions.push(second) : null;
     (third) ? descriptions.push(third) : null;
     
     return descriptions;
   }  
   
multipleUnitDesc 
 = first:(unitDesc)? (ws+)? 
   second:(unitDesc)? (ws+)?
   third:(unitDesc)? (ws+)?
   { 
     let descriptions = [];
     (first) ? descriptions.push(first) : null;
     (second) ? descriptions.push(second) : null;
     (third) ? descriptions.push(third) : null;
     
     return descriptions;
   } 

ws
  = ' '
  / [\t]

space
  = ' '

float
  = $($(integer+)? [.] $(integer+))

mixed_number
  = $($(integer+) space fraction)
  / $(integer+ dashes+ integer+)

fraction
  = $($(integer+) [/] $(integer+))

integer
  = [0-9]

unicode
  = '½' { return '1/2'; }
  / '⅓' { return '1/3'; }
  / '⅔' { return '2/3'; }
  / '¼' { return '1/4'; }
  / '¾' { return '3/4'; }
  / '⅕' { return '1/5'; }
  / '⅖' { return '2/5'; }
  / '⅗' { return '3/5'; }
  / '⅘' { return '4/5'; }
  / '⅙' { return '1/6'; }
  / '⅚' { return '5/6'; }
  / '⅐' { return '1/7'; }
  / '⅛' { return '1/8'; }
  / '⅜' { return '3/8'; }
  / '⅝' { return '5/8'; }
  / '⅞' { return '7/8'; }
  / '⅑' { return '1/9'; }
  / '⅒' { return '1/10'; }

alphanumeric
  = [a-z0-9]i

letter
  = [a-z]i

dashes
 = [-_]

punctuation
 = [,]
  / [.]
  / [!]
  / [?]
  
ignore
  = $(ws* "a" ws+)
  / $(ws* "an" ws+)
  / $(ws* "of" ws+)
  / $(ws* "for" ws+)

phrase
  = $(word (space word)*)

word
  = $(letter+ dashes+ letter+) //"pre-heat"
  / $(integer+ dashes+ letter+) //"1-inch"
  / letter+ //"heat"

amount
  = $(integer* ws* unicode)
  / float
  / mixed_number
  / fraction
  / $(integer+)
//ws* below causes leek to parse to l eek
//but ws+ breaks our container parsing

unit
  = unit:$(english_unit) ws:ws+ { return unit; }
  / unit:$(metric_unit) ws:ws+ { return unit; }
  / unit:$(imprecise_unit) ws:ws+ { return unit; }

containerizedUnit
  = unit:$(english_unit) ws:ws* { return unit; }
  / unit:$(metric_unit) ws:ws* { return unit; }
  / unit:$(imprecise_unit) ws:ws* { return unit; }

english_unit
  = cup
  / fluid_ounce
  / gallon
  / ounce
  / pint
  / pound
  / quart
  / tablespoon
  / teaspoon

cup
  = 'cups'i
  / 'cup'i
  / 'c.'i
  / 'c'i

fluid_ounce
  = 'fluid ounces'i
  / 'fluid ounce'i
  / 'fl. oz.'i
  / 'fl oz'i

gallon
  = 'gallons'i
  / 'gallon'i
  / 'gal.'i
  / 'gal'i

ounce
  = 'ounces'i
  / 'ounce'i
  / 'oz.'i
  / 'oz'i

pint
  = 'pints'i
  / 'pint'i
  / 'pt.'i
  / 'pt'i

pound
  = 'pounds'i
  / 'pound'i
  / 'lbs.'i
  / 'lbs'i
  / 'lb.'i
  / 'lb'i

quart
  = 'quarts'i
  / 'quart'i
  / 'qts.'i
  / 'qts'i
  / 'qt.'i
  / 'qt'i

tablespoon
  = 'tablespoons'i
  / 'tablespoon'i
  / 'tbsp.'i
  / 'tbsp'i
  / 'tbs.'i
  / 'tbs'i
  / 'T.'
  / 'T'
  / 'tbl'i
  / 'tbsps'i

teaspoon
  = 'teaspoons'i
  / 'teaspoon'i
  / 'tsp.'i
  / 'tsp'i
  / 't.'
  / 't'

metric_unit
  = gram
  / kilogram
  / liter
  / milligram
  / milliliter

gram
  = 'grams'i
  / 'gram'i
  / 'gms'i
  / 'gr.'i
  / 'gr'i
  / 'gm'i
  / 'g.'i
  / 'g'i

kilogram
  = 'kilograms'i
  / 'kilogram'i
  / 'kg.'i
  / 'kg'i

liter
  = 'liters'i
  / 'liter'i
  / 'l.'i
  / 'l'i
  / 'litres'i

milligram
  = 'milligrams'i
  / 'milligram'i
  / 'mg.'i
  / 'mg'i

milliliter
  = 'milliliters'i
  / 'milliliter'i
  / 'ml.'i
  / 'ml'i
 
imprecise_unit
  = pinch
  / dash
  / touch
  / handful
  / 'pieces'i
  / 'piece'i
  / 'bowls'i
  / 'bowl'i
  / 'few'i
  / 'cans'i
  / 'can'i
  / 'small'i
  / 'medium'i
  / 'large'i
  / 'bunch'i
  / 'big'i
  / 'ears'i
  / 'ear'i
  / 'ea'i
  / 'handful'i
  / 'heads'i
  / 'head'i
  / 'knobs'i
  / 'knob'i
  / 'cm'i
  / 'sprinkle'i
  / 'bricks'i
  / 'brick'i
  / 'bunches'i
  / 'bunch'i
  / 'cubes'i
  / 'cube'i
  / 'drops'i
  / 'drop'i
  / 'leaves'i
  / 'leaf'i
  / 'slices'i
  / 'slice'i
  / 'sprigs'i
  / 'sprig'i
  / 'strips'i
  / 'strip'i
  / 'some'i
  / 'stalks'i
  / 'stalk'i
  / 'turns'i
  / 'recipe'i

pinch
  = 'pinches'i
  / 'pinch'i
  / 'generous pinch'i

dash
  = 'dashes'i
  / 'dash'i

touch
  = 'touches'i
  / 'touch'i

handful
  = 'handfuls'i
  / 'handful'i

container
  = '(' amount:$(amount)* ws* unit:$(containerizedUnit)* ')' {
   return {amount: amount, unit: unit };
  }

commonDesc
 = 'grated'i

unitDesc
 = $(integer+ dashes+ 'inch'+ 'es'*)
  / commonDesc
  / 'scant'i
  / 'small'i
  / 'medium'i
  / 'large'i
  / 'big'i
  / 'serving'i

ingredientDesc
  = commonDesc
  / 'canned'i
  / 'chilled'i
  / 'chopped'i
  / 'coarsely'i
  / 'coarse'i
  / 'cold'i
  / 'cooked'i
  / 'cracked'i
  / 'crushed'i
  / 'diced'i
  / 'dried'i
  / 'dry'i
  / 'fatty'i
  / 'fat'i
  / 'finely'i
  / 'fine'i
  / 'freshly'i
  / 'fresh'i
  / 'frozen'i
  / 'good'i
  / 'ground'i
  / 'homemade'i
  / 'hot'i
  / 'leftover'i
  / 'mashed'i
  / 'melted'i
  / 'minced'i
  / 'nonstick'i
  / 'pitted'i
  / 'regular'i
  / 'room-temperature'i
  / 'roughly'i
  / 'shaved'i
  / 'shredded'i
  / 'sliced'i
  / 'soft'i
  / 'steamed'i
  / 'thinly'i
  / 'thin'i
  / 'thick cut'i
  / 'thick'i
  / 'tinned'i
  / 'toasted'i
  / 'unsalted'i
  / 'warm'i
  / 'whole'i

ingredient
  = first:$(phrase) ws* '/' ws* second:$(phrase) {
    return [first, second];
  }
  / phrase:phrase {
      let ingredients = phrase.split(' or ');
      if (ingredients.length === 1) {
        ingredients = phrase.split(' and ');
      }
      return ingredients.map(str => {
          return str.trim();
      });
    }
  
    
alphanumericPhrase
  = $(mixedWord (space mixedWord)*)
  
mixedWord
  = letter+
  / integer+
  / '('+ phrase + ')'


//this is kind of janky and could be rethought out
// we've got some weird nesting of arrays o
comment
  = indicator:$(ws? ','+ ws) phrase:alphanumericPhrase { return [phrase]; } //", for dusting"
  / indicator:$(ws? dashes+ ws+) phrase:alphanumericPhrase { return [phrase]; } //" - for dusting"
  / indicator:$(ws? '('+) phrase:alphanumericPhrase ')'+ ','* ws*  phrase2:alphanumericPhrase* {
     let phrases = [];
     (phrase) ? phrases.push(phrase) : null;
     (phrase2) ? phrases.push(phrase2) : null;
     return phrases;
  }
  
  
  