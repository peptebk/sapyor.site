# sapyor.site

### Technology
- **React 18.2.0** - library for creating user interfaces
- **React DOM** - tools for working with DOM
- **React Scripts 5.0.1** - a set of scripts for building and launching an application
- **CSS** - styling of interface elements
- **JavaScript ES6+** - application logic

### Features
- **Adaptive cell size**: automatically resize cells based on available space
- **Flag system**: the ability to mark suspicious cells with a right mouse click
- **Game timer**: tracking the time of passing the level
- **Min Counter**: shows the number of remaining unmarked mines
- **Automatic opening of empty areas**: When an empty cell is opened, adjacent empty areas are automatically opened
- **Generation of "solvable" boards**: The generation algorithm ensures that each new game can be solved without the need for guessing

### Mechanics
- Left click to open a cell
- Right click - install/remove the flag
- "New game" button - restart the current level
- Difficulty level selection - Switch between three options

### Adaptability
- The application adapts to different screen sizes
- Automatic cell size calculation for optimal display
- Support for mobile devices with smaller cell sizes

## Installation and launch
1. Make sure that you have installed Node.js
2. Install the dependencies: `npm install`
3. Launch the application: `npm start`

## Algorithms
- **Field generation**: randomly placing mines to check for possible solutions
- **Counting neighboring mines**: analyzing eight neighboring cells for each cell
- **Opening empty areas**: recursively opening related empty cells
- **Victory check**: comparing the number of open cells with the total number of non-mines

(image.png)
