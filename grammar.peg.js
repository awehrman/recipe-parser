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
  / 'tbsps'i
  / 'tbsp.'i
  / 'tbsp'i
  / 'tbs.'i
  / 'tbs'i
  / 'tbl'i
  / 'T.'
  / 'T'

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
  / 'kgs'i
  / 'kg'i

liter
  = 'liters'i
  / 'litres'i
  / 'liter'i
  / 'l.'i
  / 'l'i

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
  = 'generous pinch'i
/ 'sprigs of'i
/ 'splash of'i
/ 'slices of'i
/ 'pinch of'i
/ 'drops of'i
/ 'piece of'i
/ 'stick of'i
/ 'handfuls'i
/ 'stalk of'i
/ 'sprinkle'i
/ 'handful'i
/ 'touches'i
/ 'pinches'i
/ 'handful'i
/ 'bunches'i
/ 'splash'i
/ 'inches'i
/ 'rounds'i
/ 'can of'i
/ 'dashes'i
/ 'pieces'i
/ 'medium'i
/ 'bricks'i
/ 'leaves'i
/ 'slices'i
/ 'sprigs'i
/ 'strips'i
/ 'stalks'i
/ 'sticks'i
/ 'recipe'i
/ 'loaves'i
/ 'sheet'i
/ 'piece'i
/ 'extra'i
/ 'stick'i
/ 'touch'i
/ 'pinch'i
/ 'piece'i
/ 'bowls'i
/ 'small'i
/ 'large'i
/ 'bunch'i
/ 'heads'i
/ 'knobs'i
/ 'brick'i
/ 'bunch'i
/ 'cubes'i
/ 'drops'i
/ 'slice'i
/ 'sprig'i
/ 'strip'i
/ 'stalk'i
/ 'turns'i
/ 'loave'i
/ 'packs'i
/ 'loaf'i
/ 'glug'i
/ 'inch'i
/ 'unit'i
/ 'dash'i
/ 'bowl'i
/ 'cans'i
/ 'ears'i
/ 'head'i
/ 'knob'i
/ 'cube'i
/ 'drop'i
/ 'leaf'i
/ 'some'i
/ 'pack'i
/ 'can'i
/ 'few'i
/ 'can'i
/ 'big'i
/ 'ear'i
/ 'in'i
/ 'li'i
/ 'ea'i
/ 'cm'i

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
  / 'heaping'i

ingredientDesc
  = commonDesc
/ 'room-temperature'i
/ 'freshly ground'i
/ 'medium-bodied'i
/ 'low-sodium'i
/ 'low sodium'i
/ 'vine-ripe'i
/ 'thick cut'i
/ 'uncooked'i
/ 'boneless'i
/ 'assorted'i
/ 'blanched'i
/ 'unsalted'i
/ 'shredded'i
/ 'lukewarm'i
/ 'nonstick'i
/ 'leftover'i
/ 'homemade'i
/ 'coarsely'i
/ 'quality'i
/ 'organic'i
/ 'skin-on'i
/ 'roasted'i
/ 'day old'i
/ 'day-old'i
/ 'bone in'i
/ 'bone-in'i
/ 'toasted'i
/ 'steamed'i
/ 'roughly'i
/ 'regular'i
/ 'freshly'i
/ 'crushed'i
/ 'cracked'i
/ 'chopped'i
/ 'chilled'i
/ 'peeled'i
/ 'floury'i
/ 'packed'i
/ 'tinned'i
/ 'thinly'i
/ 'sliced'i
/ 'shaved'i
/ 'smooth'i
/ 'pitted'i
/ 'minced'i
/ 'melted'i
/ 'mashed'i
/ 'ground'i
/ 'frozen'i
/ 'finely'i
/ 'cooked'i
/ 'coarse'i
/ 'canned'i
/ 'crispy'i
/ 'sized'i
/ 'whole'i
/ 'runny'i
/ 'thick'i
/ 'fresh'i
/ 'fatty'i
/ 'dried'i
/ 'diced'i
/ 'flat'i
/ 'ripe'i
/ 'pure'i
/ 'best'i
/ 'very'i
/ 'warm'i
/ 'torn'i
/ 'aged'i
/ 'thin'i
/ 'soft'i
/ 'good'i
/ 'fine'i
/ 'cold'i
/ 'good'i
/ 'raw'i
/ 'hot'i
/ 'fat'i
/ 'dry'i

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


