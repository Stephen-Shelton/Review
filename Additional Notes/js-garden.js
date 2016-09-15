/**** Objects ****/
Everything in JS acts as an object except for null and undefined.
  - simple/primitive data types: numbers, strings, booleans
    - number literals can be used as objects with workarounds
  - complex data types: object literals, arrays, functions

Objects can be used as hashmaps, which consist of named properties mapped to values
New object literals inherit properties from Object.prototype
Can access properties via dot and bracket notation
  - bracket notation allows the use of property names that would otherwise lead to syntax errors, e.g. '1234'

Can only delete a property via the delete keyword

Properties can be defined as plain characters or strings, but keywords used for properties must be defined as strings to avoid syntax errors


/**** Prototypes ****/
JS uses a prototypical inheritance model, not a classical one.
Prototypical is more powerful than the classic model, fairly trivial to build classic model on top of prototypical, but difficult to build prototypical on top of classical

Inheritance happens through prototype chains.

Example:
function Foo() {
    this.value = 42;
}
Foo.prototype = {
    method: function() {}
};

function Bar() {}

// Set Bar's prototype to a new instance of Foo
Bar.prototype = new Foo();
Bar.prototype.foo = 'Hello World';

// Make sure to list Bar as the actual constructor
Bar.prototype.constructor = Bar;

var test = new Bar(); // create a new bar instance

// The resulting prototype chain
test [instance of Bar]
    Bar.prototype [instance of Foo]
        { foo: 'Hello World' }
        Foo.prototype
            { method: ... }
            Object.prototype
                { toString: ... /* etc. */ }

- test inherits from Bar.prototype and Foo.prototype. new Bar() does NOT create a new instance of Foo, but rather reuses the one instance of Foo that was assigned to Bar.prototype, thus all Bar instances share the same 'value' property

JS traverses the prototype chain upwards until it finds a property with the requested name, and goes until Object.prototype. If not property found, JS returns undefined.

Though prototype property is used to build prototype chains, it's possible to assign any given value to it, however primitives get ignored when assigned as a prototype. E.g. Foo.prototype = 1 has no effect

Trying to access non-existent properties or properties high up on the prototype chain may result in poor performance since every property in the chain is enumerated upon until the target property is found.

Should never extend the properties of Object.prototype or other built-in prototypes, this is monkey patching and it breaks encapsulation. Only it do it to make code compatible with newer JS features.

hasOwnProperty, which comes from Object.prototype, is the only thing in JS that deals with properties and does NOT traverse the prototype chain. hasOwnProperty checks for the object's properties at hand without traversing the prototype chain, and returns a boolean.

Example:
// Poisoning Object.prototype
Object.prototype.bar = 1;
var foo = {goo: undefined};

foo.bar; // 1
'bar' in foo; // true

foo.hasOwnProperty('bar'); // false
foo.hasOwnProperty('goo'); // true


Since JS doesn't protect the hasOwnProperty keyword, need to be mindful of using it! To be safe, can use {} or Object.prototype with call, apply, or bind.

Example:
var foo = {
    hasOwnProperty: function() {
        return false;
    },
    bar: 'Here be dragons'
};

foo.hasOwnProperty('bar'); // always returns false

// Use another Object's hasOwnProperty and call it with 'this' set to foo
({}).hasOwnProperty.call(foo, 'bar'); // true

// It's also possible to use hasOwnProperty from the Object
// prototype for this purpose
Object.prototype.hasOwnProperty.call(foo, 'bar'); // true


Like the 'in' operator, the 'for in' loop traverses the prototype chain when iterating over the properties of an object (except for properties that have their enumerable attribute set to false, e.g. length property of an array)

Each additional layer of inheritance added to an object will cause for in traversals to become slower since for in traverses the entire prototype chain

In newer versions of ECMAScript, you can define properties to be non-enumerable with Object.defineProperty, reducing the risk of iterating over properties without using hasOwnProperty (via for in loops, property lookups)


/*** Functions ***/
In JS, functions are 1st-class objects, so they can be passed around as values, e.g. anonymous functions as callbacks in other functions

Functions are always hoisted to the top of the scopes in which they're defined

function declaration: function foo(params) {}
function expression var foo = function() {}
  -assigns anonymous function to variable foo

variable assignments only happen at runtime (where they're declared), but variable declarations get hoisted right below function declarations

Weird edge case of named function expressions. Cannot invoke bar in outer scope, but it's made available to invoke in the inner scope. Names of functions are always made available in the local scope of the function itself. Invoking foo results in blowing the call stack.
example:
var foo = function bar() {
    bar(); // Works
}
bar(); // ReferenceError


/**** this ****/
5 different ways in which 'this' can be bound in JS
1) global scope
  this; <--this in the global scope simply refers to the global object

2) calling a function
  foo(); <--again makes this refer to the global object

3) calling a method
  test.foo(); <--test is the object, foo is the method, 'this' refers to test

4) calling a constructor
  new foo(); <--foo acts as a constructor, inside the function, 'this' refers to a newly created object

5) explicit setting of 'this'
  used with call, apply, and bind methods of Function.prototype where value of 'this' inside the function gets explicitly set to the first argument of the corresponding function call

  example:
  function foo(a, b, c) {}

  var bar = {};
  foo.apply(bar, [1, 2, 3]); // with apply, arguments placed in an array
  foo.call(bar, 1, 2, 3); // with call, arguments separated by commas

  - both cases, 'this' inside of foo is set to bar and function foo is invoked
  - results in a = 1, b = 2, c = 3

Pitfalls
example:
  Foo.method = function() {
      function test() {
          // this is set to the global object, NOT Foo
      }
      test();
  }

In order to gain access to Foo from within test, you can create a local variable inside of method that refers to Foo
  Foo.method = function() {
    var self = this;
    function test() {
      //use self instead of this here, self refers to an outer 'this', in combination with closures it can be used to pass this values around
      //this still refers to global object, but self refers to Foo
    }
    test();
  }

Can also use bind combined with an anonymous function to achieve the same result
  Foo.method = function() {
    var test = function() {
      //this now refers to Foo
    }.bind(this);
    test();
  }

Cannot assign methods to variables in JS while preserving 'this', which is function aliasing
e.g. var test = someObject.methodTest; <--does NOT preserve this, simply a function reference


/**** Closures and References ****/
One of JS' most powerful features is closure, where scopes always keep access to the outer scope in which they were defined. The only scoping that JS has is function scope, so all functions, by default, act as closures.

  example:
  function Counter(start) {
      var count = start;
      return {
          increment: function() {
              count++;
          },

          get: function() {
              return count;
          }
      }
  }

  var foo = Counter(4); <--Counter invoked with 4, returned object assigned to foo
  foo.increment(); //increments count by 1
  foo.get(); // 5 is returned

  Invoking Counter returns 2 closures, function increment and function get, which both keep a reference to the scope of Counter, and therefore always keep access to the count variable defined in Counter's scope. count is the private variable that closure gives us access to.

  example:
  var foo = new Counter(4);
  foo.hack = function() {
      count = 1337; // does not change count in the scope of Counter since foo.hack was not defined in Counter's scope, it's defined in the global scope, so it will instead create or override the global variable 'count'
  };

Tricky to use closures inside of loops
example:
  for(var i = 0; i < 10; i++) {
      setTimeout(function() {
          console.log(i); //prints 10 ten times
      }, 1000);
  }

  The anonymous function keeps a reference to i. At the time console.log gets called, the for loop has already finished, and the value of i has been set to 10.

  In order to get the desired behavior, can achieve this in 4 different ways:
  1) anonymous wrapper
    for(var i = 0; i < 10; i++) {
      (function(e) {
          setTimeout(function() {
              console.log(e);
          }, 1000);
      })(i);
    }

  2) return a function from the anonymous wrapper
    for(var i = 0; i < 10; i++) {
        setTimeout((function(e) {
            return function() {
                console.log(e);
            }
        })(i), 1000)
    }

  3) add an additional argument to the setTimeout function, which passes these arguments to the callback
    for(var i = 0; i < 10; i++) {
      setTimeout(function(e) {
          console.log(e);
      }, 1000, i);
    }

  4) using .bind, which can bind a this context and arguments to function
    for(var i = 0; i < 10; i++) {
      setTimeout(console.log.bind(console, i), 1000);
    }
    //this set to console, log invoked with i as the argument


/**** arguments object ****/
array-like object that holds all the arguments that were passed to a function.
it's not an array and does not inherit from Array.prototype, but it does have a length property. Must convert it to a real array to use standard Array methods on it.

e.g. Array.prototype.slice.call(arguments); <--process is slow

Faster to use apply
  e.g.
  function foo() {
      bar.apply(null, arguments); //bar with its arguments are called within foo
  }
  function bar(a, b, c) {
      // do stuff here
  }

changing the value of a formal parameter will also change the value of the corresponding property on the arguments object, and the other way around.
  example:
  function foo(a, b, c) {
    arguments[0] = 2;
    a; // 2 <--change prop value, param value changes

    b = 4; <--change param value, prop value changes
    arguments[1]; // 4

    var d = c;
    d = 9;
    c; // 3
  }
  foo(1, 2, 3);


/**** constructors ****/
Any function call preceded by the 'new' keyboard acts as a constructor. Inside the constructor/function, 'this' refers to a newly created object, and the prototype of the newly created object is set to the prototype of the function object that was invoked as the constructor. If the function that was called has no explicit return statement, then it implicitly returns the value of 'this' - the new object.

example:
  function Person(name) {
      this.name = name;
  }

  Person.prototype.logName = function() {
      console.log(this.name);
  };

  var sean = new Person("sean"); <--call Person as constructor and sets prototype of new object to Person.prototype

In case of an explicit return statement, the function returns the value specified by that statement, but only if the return value is an Object.

example:
  function Car() {
      return 'ford';
  }
  new Car(); // a new object, not 'ford' since 'ford' isn't an object

  function Person() {
      this.someValue = 2;

      return {
          name: 'Charles'
      };
  }
  new Person(); // the returned object ({name:'Charles'}), not including someValue since an object was returned

  Since Person returns an object, Person() and new Person() do the same thing.


/**** Creating new objects via factories ****/
Alternative to constructors to create objects.

example:
  function CarFactory() {
      var car = {};
      car.owner = 'nobody';

      var milesPerGallon = 2;

      car.setOwner = function(newOwner) {
          this.owner = newOwner;
      }

      car.getMPG = function() {
          return milesPerGallon;
      }

      return car;
  }

While the above is robust against a missing new keyword and certainly makes the use of private variables easier, it comes with some downsides.

1) It uses more memory since the created objects do not share the methods on a prototype.
2) In order to inherit, the factory needs to copy all the methods from another object or put that object on the prototype of the new object.
3) Dropping the prototype chain just because of a left out new keyword is contrary to the spirit of the language.


/**** scopes and namespaces ****/
JS does NOT support block scope (unless you use es6), so all that's left is function scope. e.g. loops do not create new scopes

there are also no distinct namespaces in JavaScript, everything gets defined in one globally shared namespace. Each time a variable is referenced, JavaScript will traverse upwards through all the scopes until it finds it. In the case that it reaches the global scope and still has not found the requested name, it will raise a ReferenceError.

Global variables can cause issues
// script A
foo = '42'; <--defines foo in global scope

// script B
var foo = '42' <--defines foo in current scope, using var is the different here!

not using var will introduce horrible, hard-to-track-down bugs. The var statement should never be left out unless the desired effect is to affect the outer scope (which may ruin encapsulation).
