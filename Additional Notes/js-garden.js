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

JS traverses the prototype chain upwards until it finds a property with the requested name, and goes until Object.prototype. If property not found, JS returns undefined.

Though prototype property is used to build prototype chains, it's possible to assign any given value to it, however primitive values get ignored when assigned as a prototype. E.g. Foo.prototype = 1 has no effect

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
            return false; //overrides the native method from Object.prototype
        },
        bar: 'Here be dragons'
    };

    foo.hasOwnProperty('bar'); // always returns false

    // Use another Object's hasOwnProperty and call it with 'this' set to foo
    ({}).hasOwnProperty.call(foo, 'bar'); // true

    // It's also possible to use hasOwnProperty from the Object.prototype for this purpose
    Object.prototype.hasOwnProperty.call(foo, 'bar'); // true


Like the 'in' operator, the 'for in' loop traverses the prototype chain when iterating over the properties of an object (except for properties that have their enumerable attribute set to false, e.g. length property of an array)

Each additional layer of inheritance added to an object will cause for in traversals to become slower since 'for in' traverses the entire prototype chain

In newer versions of ECMAScript, you can define properties to be non-enumerable with Object.defineProperty, reducing the risk of iterating over properties without using hasOwnProperty (via for in loops, property lookups)


/*** Functions ***/
In JS, functions are 1st-class objects, so they can be passed around as values, e.g. anonymous functions as callbacks in other functions

Functions are always hoisted to the top of the scopes in which they're defined

function declaration: function foo(params) {}
function expression var foo = function() {};
  -assigns anonymous function to variable foo

variable assignments only happen at runtime (where they're declared), but variable declarations get hoisted right below function declarations

Weird edge case of named function expressions, see below example. Cannot invoke bar in outer scope, but it's made available to invoke in the inner scope. Names of functions are always made available in the local scope of the function itself. Invoking foo results in blowing the call stack.

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
  new foo(); <--foo acts as a constructor, inside the function, 'this' refers to a newly created object.

  example:
      function Foo(name) {
        this.name = name; <-- this refers to the object created from Foo
      }
      var somebody = new Foo('greg'); <--creates an object and assigns it to variable somebody, {name: 'greg'}, somebody.name is 'greg'

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
            // 'this' within test is set to the global object, NOT Foo
        }
        test();
    }

In order to gain access to Foo from within test, you can create a local variable inside of the method that refers to Foo
example:
    Foo.method = function() {
      var self = this;
      function test() {
        //use self instead of this here, self refers to an outer 'this', in combination with closures it can be used to pass 'this' values around
        //'this' still refers to global object, but self refers to Foo
      }
      test();
    }

Can also use bind combined with an anonymous function to achieve the same result
example:
    Foo.method = function() {
      var test = function() {
        //this now refers to Foo
      }.bind(this);
      test();
    }

Cannot assign methods to variables (i.e. function aliasing) in JS while preserving 'this'
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

    var foo = Counter(4); <--Counter invoked with 4, returned object assigned to variable foo
    foo.increment(); //increments count by 1
    foo.get(); // 5 is returned

  Invoking Counter returns 2 closures, function increment and function get, which both keep a reference to the scope of Counter, and therefore always keep access to the count variable defined in Counter's scope. count is the private variable that closure gives us access to.

  example:
      var foo = new Counter(4);
      foo.hack = function() {
          count = 1337; // does NOT change count in the scope of Counter since foo.hack was NOT defined in Counter's scope, it's defined in the global scope, so it will instead create or override the global variable 'count'
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
  1) anonymous wrapper - wrap setTimeout in IIF that has access to i
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

  3) add an additional argument to the setTimeout function, which passes these arguments to the callback (probably the easiest to do)
    for(var i = 0; i < 10; i++) {
      setTimeout(function(e) {
          console.log(e);
      }, 1000, i);
    }

  4) using .bind, which can bind a this context and arguments to function
    for(var i = 0; i < 10; i++) {
      setTimeout(console.log.bind(console, i), 1000);
    }
    //this set to console, log method of console invoked with i as the argument


/**** arguments object ****/
array-like object that holds all the arguments that were passed to a function.
it's not an array and does not inherit from Array.prototype, but it does have a length property. Must convert it to a real array to use standard Array.prototype methods on it.

e.g. Array.prototype.slice.call(arguments); <--process is slow

Faster to use apply to pass around arguments
example:
    function foo() {
        bar.apply(null, arguments); //bar and its arguments are called in foo
    }
    function bar(a, b, c) {
        // do stuff here
    }

changing the value of a formal parameter will also change the value of the corresponding property on the arguments object, and vice versa.
example:
    function foo(a, b, c) {
      arguments[0] = 2; <--change prop value...
      a; // 2  <--param value changes

      b = 4; <--change param value...
      arguments[1]; // 4 <--prop value changes

      var d = c;
      d = 9;
      c; // 3 <--declared and changed d's value, but NOT c's value
    }
    foo(1, 2, 3);


/**** constructors ****/
Any function call preceded by the 'new' keyword acts as a constructor. Inside the constructor/function, 'this' refers to a newly created object, and the prototype of the newly created object is set to the prototype of the function object that was invoked as the constructor. If the function that was called has no explicit return statement, then it implicitly returns the value of 'this' - the new object.

example:
    function Person(name) {
        this.name = name;
    }

    Person.prototype.logName = function() {
        console.log(this.name);
    };

    var sean = new Person("sean"); <--call Person as constructor and sets prototype of new object to Person.prototype

In case of an explicit return statement, the function returns the value specified by that statement, but ONLY if the return value is an Object.

example:
    function Car() {
        return 'ford';
    }
    new Car(); // returns a new object, not 'ford' since 'ford' isn't an object

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

While the above is robust against a missing 'new' keyword and certainly makes the use of private variables easier, it comes with some downsides:

  1) It uses more memory since the created objects do not share the methods on a prototype.
  2) In order to inherit, the factory needs to copy all the methods from another object or put that object on the prototype of the new object.
  3) Dropping the prototype chain just because of a left out 'new' keyword is contrary to the spirit of the language.


/**** scopes and namespaces ****/
JS does NOT support block scope (unless you use es6), so all that's left is function scope. e.g. loops do not create new scopes

there are also no distinct namespaces in JavaScript, everything gets defined in one globally shared namespace. Each time a variable is referenced, JavaScript will traverse upwards through all the scopes until it finds it. In the case that it reaches the global scope and still has not found the requested name, it will raise a ReferenceError.

Global variables can cause issues
example:
    // script A
    foo = '42'; <--defines foo in global scope

    // script B
    var foo = '42' <--defines foo in current scope bc of var

not using var will introduce horrible, hard-to-track-down bugs. The var statement should never be left out unless the desired effect is to affect the outer scope (which may break encapsulation).

Local variables declared via parameters and var statements in local scope
example:
    // global scope
    var foo = 1;
    var bar = 2;
    var i = 2;

    function test(i) {
        // local scope of the function test
        i = 5; <--local via parameter, doesn't conflict with global i

        var foo = 3; <--local via var statement, no conflict with global foo
        bar = 4; <--references global bar variable, overrides bar's value
    }
    test(10);

JS hoists var statements and function declarations to the to of their enclosing scopes.
example pre-hoisting:
    bar();
    var bar = function() {};
    var someValue = 42;

    test();
    function test(data) {
      if (false) {
          goo = 1;

      } else {
          var goo = 2;
      }
      for(var i = 0; i < 100; i++) {
          var e = data[i];
      }
    }

example post-hoisting:
    // var statements got moved here
    var bar, someValue; // default to 'undefined'

    // the function declaration got moved up too
    function test(data) {
        var goo, i, e; // missing block scope moves these here
        if (false) {
            goo = 1;

        } else {
            goo = 2;
        }
        for(i = 0; i < 100; i++) {
            e = data[i];
        }
    }

    bar(); // fails with a TypeError since bar is still 'undefined'
    someValue = 42; // assignments are not affected by hoisting
    bar = function() {};

    test();

Name resolution order:
All scopes in JavaScript, including the global scope, have the special name this, defined in them, which refers to the current object.

Function scopes also have the name arguments, defined in them, which contains the arguments that were passed to the function. (having a parameter called arguments will prevent the creation of the default arguments object)

For example, when trying to access a variable named foo inside the scope of a function, JavaScript will look up the name in the following order:

  1) var statement - In case there is a var foo statement in the current scope, use that.
  2) parameter -  If one of the function parameters is named foo, use that.
  3) function name - If the function itself is called foo, use that.
  4) outer scope- Go to the next outer scope, and start with #1 again.

namespaces
A common problem associated with having only one global namespace is the likelihood of running into problems where variable names clash. In JavaScript, this problem can easily be avoided with the help of anonymous wrappers. Unnamed functions are considered expressions; so in order to be callable, they must first be evaluated.

example:
    ( // evaluate the function inside the parentheses
    function() {}
    ) // and return the function object
    () // call the result of the evaluation

Other ways of evaluating and invoking function expressions, IIFEs
examples:
    // A few other styles for directly invoking the
    !function(){}()
    +function(){}()
    (function(){}());
    // and so on...

It is recommended to always use an anonymous wrapper to encapsulate code in its own namespace. This does not only protect code against name clashes, but it also allows for better modularization of programs. Additionally, the use of global variables is considered bad practice. Any use of them indicates badly written code that is prone to errors and hard to maintain.


/**** Arrays ****/
No good reason to use for in loop on arrays. for in enumerates on all properties on the object, and the only way to avoid that is using hasOwnProperty. Fastest to just use a for loop.

example:
    var list = [1, 2, 3, 4, 5, ...... 100000000];
    for(var i = 0, l = list.length; i < l; i++) {
        console.log(list[i]);
    }

There is one extra catch in the above example, which is the caching of the length of the array via l = list.length.

Although the length property is defined on the array itself, there is still an overhead for doing the lookup on each iteration of the loop. And while recent JavaScript engines may apply optimization in this case, there is no way of telling whether the code will run on one of these newer engines or not.

In fact, leaving out the caching may result in the loop being only half as fast as with the cached length.

length property:
While the getter of the length property simply returns the number of elements that are contained in the array, the setter can be used to truncate the array.

example:
    var arr = [1, 2, 3, 4, 5, 6];
    arr.length = 3;
    arr; // [1, 2, 3]

    arr.length = 6;
    arr.push(4);
    arr; // [1, 2, 3, undefined, undefined, undefined, 4]

Assigning a smaller length truncates the array. Increasing it creates a sparse array.

Thus, use plain for loops instead of for in loops and cache the length property.

Array constructor:
Since the Array constructor is ambiguous in how it deals with its parameters, it is highly recommended to use the array literal - [] notation - when creating new arrays.
example:
    [1, 2, 3]; // Result: [1, 2, 3]
    new Array(1, 2, 3); // Result: [1, 2, 3]

    [3]; // Result: [3]
    new Array(3); // Result: [] <--sparse/empty array, length set to 3
    new Array('3') // Result: ['3']

In cases when there is only one argument passed to the Array constructor and when that argument is a Number, the constructor will return a new sparse array with the length property set to the value of the argument. It should be noted that only the length property of the new array will be set this way; the actual indexes of the array will not be initialized.


/**** Types ****/
== utilizes type coercion, == regarded as bad practice
=== for strict equality, no type coercion, faster

== and === behave differently when one operand is an object.
example:
    {} === {};                   // false, 2 different instances of obj literals
    new String('foo') === 'foo'; // false
    new Number(10) === 10;       // false
    var foo = {};
    foo === foo;                 // true, comparing same instance of foo

Here, both operators compare for identity and not equality; that is, they will compare for the same instance of the object

typeof operator:
typeof and instanceof are both huge design flaws of javascript. they're unreliable. typeof should only be used to check whether a variable is defined.

class of an object:
The value of [[Class]] can be one of the following strings. Arguments, Array, Boolean, Date, Error, Function, JSON, Math, Number, Object, RegExp, String.
To determine an object's [[Class]] value, use Object.prototype.toString. It returns a string in the following format: '[object ' + valueOfClass + ']', e.g [object String] or [object Array].

examples:
    Object.prototype.toString.call({}) // [object Object]
    Object.prototype.toString.call(() => {}) // [object Function]
    Object.prototype.toString.call(5) // [object Number]
    Object.prototype.toString.call("word") // [object String]
    Object.prototype.toString.call(true) // [object Boolean]
    Object.prototype.toString.call([]) // [object Array]

instanceof:
compares the constructors of its two operands, only useful when comparing custom made objects that originate from the same JS context. it's nearly as useless as typeof

example comparing custom objects:
    function Foo() {}
    function Bar() {}
    Bar.prototype = new Foo();

    new Bar() instanceof Bar; // true
    new Bar() instanceof Foo; // true

    // This just sets Bar.prototype to the function object Foo,
    // but not to an actual instance of Foo
    Bar.prototype = Foo;
    new Bar() instanceof Foo; // false

Type Casting:
JS is weakly typed, so it'll apply type coercion wherever possible
Avoid using constructors other than for objects, e.g. new Number(10)

explicit coercion:
10 + '' --> '10'
+ '10' --> 10 ('10'+ doesn't work)
!!'foo' --> true


/**** Core ****/
avoid using eval, you don't need it and it creates security risks.

undefined, examples:
    Accessing the (unmodified) global variable undefined.
    Accessing a declared but not yet initialized variable.
    Implicit returns of functions due to missing return statements.
    return statements that do not explicitly return anything.
    Lookups of non-existent properties.
    Function parameters that do not have any explicit value passed.
    Anything that has been set to the value of undefined.
    Any expression in the form of void(expression)

undefined is also a global variable whose value is undefined. don't override the value of this variable or else it becomes useless in its scope

in almost all cases null can be replaced by undefined

semicolons:
JS does not enforce the use of semicolons, but it does need them to understand the source code. The JS parser automatically inserts semicolons whenever it encounters a parse error due to a missing semicolon, this is considered a big design flaw bc it can change the bx of the code. To avoid parsing problems, never omit semicolons.

the delete operator:
can't delete global variables and global functions because they have a DontDelete attribute, but can delete explicitly set properties (properties you created on an object)

example:
// explicitly set property:
    var obj = {x: 1};
    obj.y = 2;
    delete obj.x; // true
    delete obj.y; // true
    obj.x; // undefined
    obj.y; // undefined

also cannot delete parameters and the arguments object of a function


/**** other ****/
setTimeout and setInterval:
Since JavaScript is asynchronous, it is possible to schedule the execution of a function using the setTimeout and setInterval functions.

example:
  function foo() {}
  var id = setTimeout(foo, 1000); // returns a Number > 0

When setTimeout is called, it returns the ID of the timeout and schedule foo to run approximately one thousand milliseconds in the future. foo will then be executed once. Depending on the timer resolution of the JavaScript engine running the code, as well as the fact that JavaScript is single threaded and other code that gets executed might block the thread, it is by no means a safe bet that one will get the exact delay specified in the setTimeout call.

While setTimeout only runs the function once, setInterval - as the name suggests - will execute the function every X milliseconds, but its use is discouraged. When code that is being executed blocks the timeout call, setInterval will still issue more calls to the specified function. This can, especially with small intervals, result in function calls stacking up.

example:
    function foo(){
      // something that blocks for 1 second
    }
    setInterval(foo, 100);

    Here foo is run every 100 milliseconds, but foo contains code that blocks execution for 1 second, causing the call stack to build up over time

Dealing with possibly blocking code
example:
    function foo(){
        // something that blocks for 1 second
        setTimeout(foo, 100);
    }
    foo();

  This encapsulates the setTimeout call and prevents the stacking of calls.

Manually clearing timeouts:
Clearing timeouts and intervals works by passing the respective ID to clearTimeout or clearInterval, depending on which set function was used in the first place.
  example:
      var id = setTimeout(foo, 1000);
      clearTimeout(id); <--clears the timeout
