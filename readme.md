## Setup
in order to get a running system you have to clone this repository, then install the package dependcies via `npm install`

Install browserify and the TypeScript Compiler.
Transpile the .ts files to javascript with `tsc` and then build the dependencies into one single javascript file with `browserify app.js -o -app-build.js`

This step has to be repeated when changes are made.


## Usage
Parameters of the Model can be changed in the CFG.ts
To run the simulation without graphic representation uncomment the first two lines in the fn() function in app.ts and comment out the rest. Also set the Drawing Parameter to false.


### Further questions

Feel free to contact me, you can find my contact data [on my github page](http://strernd.github.io).
