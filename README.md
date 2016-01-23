sg
==

sg is short for singularity -- having only to include one module to get all
the functional programming goodness for Node.js you need.  But 'sg' was taken
on npm, so I had to use 'sgsg' -- how ironic is that?

sg is a _semi-opinionated_, _functional_, _feed-forward_ network application meta-framework.

* Semi-opinionated: If you use sg, you're pretty much forced to adopt a handful of
  conventions that sg uses.  But you're probably using them anyway.
  * Functional -- sg almost never uses `new`, `prototype`, or other OO-isms.
* Functional: Pass the subject as the first parameter.
* Feed-forward: Programmers understand code that is active much more than they
  understand declarative code.


## Giants

sg leverages a lot of the best functional modules for Node.js, like underscore, async, etc.
My intention is not to steal any of those libraries' thunder, but to give them the
credit they are due.  sg does, however, sometimes re-wrap the interfaces to be
consistent, and to name things using the functional naming conventions that I learned.

The un-changed libraries that sg uses are available as `sg.extlibs.yourfavoritelibrary`.


