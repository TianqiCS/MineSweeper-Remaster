import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';

/* The cell for a single slot */
class Square extends React.Component {
    render() {
        return (
            <button className="square" disabled={this.props.isOpen && this.props.value === null} name={this.props.value} onMouseUp={this.props.onClick}>
                {this.props.value}
            </button>
        );
    }
}

/* The Board contains all the Squares */
class Board extends React.Component {
    // render a single square
    renderSquare(i) {
        return (
            <Square
                isOpen={this.props.isOpen[i]}
                value={this.props.squares[i]}
                onClick={(e) => this.props.onClick(i,e)}
            />
        );
    }

    // render a single row of squares
    renderRow(index) {
        let row = [];
        for (let i = 0; i < this.props.settings.cols; i++) {
            row.push(this.renderSquare(i+this.props.settings.cols*index));
        }
        return row
    }

    // render the whole board
    render() {
        let rows = [];
        for (let i = 0; i < this.props.settings.rows; i++) {
            rows.push(
                <div className="board-row">
                    {this.renderRow(i)}
                </div>
            );
        }
        return (
            <div>
                {rows}
            </div>
        );
    }
}

/* The Game contains all the information as soon as the game starts */
class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            squares: Array(this.props.cols * this.props.rows).fill(null),  // array of all values of the squares
            isMine: Array(this.props.rows * this.props.cols).fill(0),  // array of telling if a square is a mine
            isOpen: Array(this.props.rows * this.props.cols).fill(0),  // array of telling if a square is opened
            isFlag: Array(this.props.rows * this.props.cols).fill(0),  // array of telling if a square is flagged
            GameOver: -1,  // identifier to tell the game state: -1 not yet start, 0 in game, 1 game over, 2 win
            rows: this.props.rows,  // the number of rows
            cols: this.props.cols,  // the number of cols
            mines: this.props.mines,  // the number of mines
            remain: this.props.mines,  // the number of remain mines: mines - flags
        };

    }

    // handle any clicks
    handleClick(i,e) {
        if (this.state.GameOver === -1) {  // if the game has not begun, we initialize the board and open the square
            this.initialize(i);
        }
        else if (!this.state.GameOver && e.nativeEvent.which === 1) {  // it is a left click, we open the square
          this.open(i)

        }
        else if (!this.state.GameOver && e.nativeEvent.which === 3) {  // it is a right click, we flag the square
          this.flag(i)
        }
        else if (!this.state.GameOver && e.nativeEvent.which === 2) {  // it is a middle button click, we try fast finish
          this.try(i)
        }
    }

    // it will run every second
    componentDidMount() {
        const self = this;
        setInterval(function() {
            self.setState({
                now: new Date(),
            });
        }, 1000);
    }

    // render the game based on the game state
    render() {
        let squares = this.state.squares.slice();
        if (this.state.GameOver === 1) {  // display the mines if game over
            for (let i = 0; i < this.state.cols * this.state.rows; i++) {
                if (this.state.isMine[i]) {
                    if (!this.state.isFlag[i]) {  // these mines are not flagged
                        squares[i] = "@";
                    }
                }
                else if (this.state.isFlag[i]) {  // these squares are wrongly flagged
                    squares[i] = "X";
                }
            }
        }
        if (this.state.GameOver === 2) {  // marks all mines as flagged when win
            for (let i = 0; i < this.state.cols * this.state.rows; i++) {
                if (this.state.isMine[i]) {
                    squares[i] = "P";
                }
            }
        }
        return (
            <div className="game">
                <div className="game-board">
                    <Board
                        squares={squares}
                        isOpen={this.state.isOpen}
                        isFlag={this.state.isFlag}
                        isMine={this.state.isMine.slice().fill(0)}
                        settings={{rows: this.state.rows, cols: this.state.cols}}
                        onClick={(i,e) => this.handleClick(i,e)}
                    />
                </div>
                <div className="game-info">
                    <div>{this.getStatus()}</div>
                    <div>{"Mine Remains: " + this.state.remain}</div>
                    <div>{"Time: " + this.state.now}</div>
                    <div>
                        <li>{"Left Click to select"}</li>
                        <li>{"Right Click to flag"}</li>
                        <li>{"Middle Button to auto select"}</li>
                        <li>{"Reload the page to restart"}</li>
                    </div>
                    <button onClick={Game.restart}>Restart</button>
                </div>
            </div>
        );
    }

    // not currently used, but it can check if the mines number is not too large
    check() {
        return this.state.mines >= this.state.rows * this.state.cols;
    }

    // display message base on game state
    getStatus() {
        switch (this.state.GameOver) {
            case -1:
                return "Ready to Begin";
            case 0:
                return "In Game";
            case 1:
              return "You Lost";
            case 2:
              return "You win";
            default:
              return "UNKNOWN"
        }
    }

    // initialize the board and make sure the first step is not a mine
    initialize(index) {
        const size = this.state.rows * this.state.cols;
        const isMine = this.state.isMine.slice();
        for (let i=0; i < this.state.mines; i++) {
            let mine = Math.floor(Math.random() * size);
            if (mine === index || isMine[mine] === 1) {  // we have a same pos or it is our first step
                i--;
            }
            else {
                isMine[mine] = 1;
            }
        }
        let isOpen = Array(this.state.cols * this.state.rows).fill(0);
        this.setState({
            isMine: isMine,
            isOpen: isOpen,
            GameOver: 0,
        },() => {  // make sure we have set state first (Asynchronous !)
            this.open(index);
        });
    }

    // open the target square and it has consequence
    open(index) {
        if (!this.state.isOpen[index] && !this.state.isFlag[index]) {  // we don't open opened or flagged squares
            if (this.state.isMine[index]) {  // unluckily, the square is a mine, better luck next time
                this.gameover(1);
            }
            else {
                this.calculate(index);  // calculate the value and may open other squares recursively

                // check if the player has won
                let opened = 0;
                for (let i=0;i < this.state.cols * this.state.rows; i++) {
                    if (this.state.isOpen[i]) {
                        opened++;
                    }
                }
                if (opened === this.state.cols * this.state.rows - this.state.mines) {
                  this.gameover(2)
                }
            }
        }
    }

    // set game state
    gameover(mode) {
      this.setState({
        GameOver: mode,
      });
    }

    // calculate the value and may open other squares recursively
    calculate(index) {
        if (!this.state.isOpen[index] && !this.state.isFlag[index]) {
            let up = false;  // boolean if we can check the upper square
            let down = false;  // boolean if we can check the lower square
            let left = false;  // boolean if we can check the left square
            let right = false;  // boolean if we can check the right square


            let sum = 0;  // sum of mines around the square

            if (this.state.isMine[index]) {  // it is a mine we stop recursion
              return 1;
            }

            else {
                const squares = this.state.squares;
                const isOpen = this.state.isOpen;

                if (index % this.state.cols) {  // there is a square on the left, so we can check left
                    if (this.state.isMine[index - 1]) {
                        sum += 1;
                    }
                    left = true;
                }
                if (index % this.state.cols !== this.state.cols-1) {  // there is a square on the right, so we can check right
                    if (this.state.isMine[index + 1]) {
                        sum += 1;
                    }
                    right = true;
                }
                if (index - this.state.cols >= 0) {
                    if (this.state.isMine[index - this.state.cols]) {  // up
                        sum += 1;
                    }
                    up = true;
                }
                if (index + this.state.cols < this.state.cols * this.state.rows) {  // down
                    if (this.state.isMine[index + this.state.cols]) {
                        sum += 1;
                    }
                    down = true;
                }

                if (up && left) {
                    if (this.state.isMine[index - 1 - this.state.cols]) {  // we check up && left
                        sum += 1;
                    }
                }
                if (up && right) {
                    if (this.state.isMine[index + 1 - this.state.cols]) {  // up && right
                        sum += 1;
                    }
                }
                if (down && left) {
                    if (this.state.isMine[index - 1 + this.state.cols]) {  // ...
                        sum += 1;
                    }
                }
                if (down && right) {
                    if (this.state.isMine[index + 1 + this.state.cols]) {  // ..
                        sum += 1;
                    }
                }
                if (sum) {squares[index] = sum;}  // if there are at least one mine, we give it a value
                isOpen[index] = true;  // it is safe to open the square
                this.setState({
                    isOpen: isOpen,
                    squares: squares
                });

                if (sum) {  // return the value if we find mines
                  return sum;
                }
                else {  // we don;t find mines and we can search recursively
                    if (left) {
                        this.calculate(index - 1)
                    }
                    if (right) {
                        this.calculate(index + 1)
                    }

                    if (up) {
                        this.calculate(index - this.state.cols)
                    }

                    if (down) {
                        this.calculate(index + this.state.cols)
                    }

                    if (up && left) {
                        this.calculate(index - 1 - this.state.cols)
                    }
                    if (up && right) {
                        this.calculate(index + 1 - this.state.cols)
                    }

                    if (down && left) {
                        this.calculate(index - 1 + this.state.cols)
                    }

                    if (down && right) {
                        this.calculate(index + 1 + this.state.cols)
                    }
                    return 0
                }
            }
        }
        else {
            return 0;
        }
    }

    // fast open all the squares if there are exactly flags around the opened & clicked square
    try(index) {
        const squares = this.state.squares.slice();
        if (this.state.isOpen[index]) {  // we only perform this action if it is opened
            let up = false;  // boolean if we can check the upper square
            let down = false;  // boolean if we can check the lower square
            let left = false;  // boolean if we can check the left square
            let right = false;  // boolean if we can check the right square
            let sum = 0;  // the sum of all flags

            if (index % this.state.cols) {  // there is a square on the left, so we can check left
                if (this.state.isFlag[index - 1]) {
                    sum += 1;
                }
                left = true;
            }
            if (index % this.state.cols !== this.state.cols-1) {  // there is a square on the right
                if (this.state.isFlag[index + 1]) {
                    sum += 1;
                }
                right = true;
            }
            if (index - this.state.cols >= 0) {
                if (this.state.isFlag[index - this.state.cols]) {  // there is a square above
                    sum += 1;
                }
                up = true;
            }
            if (index + this.state.cols < this.state.cols * this.state.rows) {  // there is a square under
                if (this.state.isFlag[index + this.state.cols]) {
                    sum += 1;
                }
                down = true;
            }

            if (up && left) {  // we check up-left square
                if (this.state.isFlag[index - 1 - this.state.cols]) {
                    sum += 1;
                }
            }
            if (up && right) {  // up && right
                if (this.state.isFlag[index + 1 - this.state.cols]) {
                    sum += 1;
                }
            }
            if (down && left) {  // down && left
                if (this.state.isFlag[index - 1 + this.state.cols]) {
                    sum += 1;
                }
            }
            if (down && right) {  // down && right
                if (this.state.isFlag[index + 1 + this.state.cols]) {
                    sum += 1;
                }
            }

            // if the sum of flags equals to the number of mines around, we can preform a fast open on nearby square
            if (sum === squares[index]) {
                if (left) {
                    this.open(index - 1);
                }
                if (right) {
                    this.open(index + 1);
                }
                if (up) {
                    this.open(index - this.state.cols);
                }
                if (down) {
                    this.open(index + this.state.cols);
                }
                if (left && up) {
                    this.open(index - 1 - this.state.cols);
                }
                if (right && up) {
                    this.open(index + 1 - this.state.cols);
                }
                if (left && down) {
                    this.open(index - 1 + this.state.cols);
                }
                if (right && down) {
                    this.open(index + 1 + this.state.cols);
                }
            }
        }
    }

    // flag or remove a flag
    flag(i) {
        const squares = this.state.squares.slice();
        const isFlag = this.state.isFlag.slice();
        if (!this.state.isOpen[i]) {  // we cannot flag a opened square
            isFlag[i] = !isFlag[i];  // reverse the flag state

            // calculate remains
            let result;
            if (isFlag[i]) {
                squares[i] = "P";
                result = 1;
            }
            else {
                squares[i] = null;
                result = -1;
            }
            this.setState({
                isFlag : isFlag,
                squares: squares,
                remain: this.state.remain - result,
            })
        }
    }

    // reload the page
    static restart() {
        window.location.reload();
    }

}

/* before we start the game, asking for some settings */
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            difficulty: 1,  // difficulty : 1 easy, 2 normal, 3 hard, 4 custom
            cols: null,  // number of columns
            rows: null,  // number or rows
            mines: null,  // number of mines
            start: false,  // is the game started
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    // handle form input changes
    handleChange(event) {
        this.setState({[event.target.name]: parseInt(event.target.value)});
    }

    // handle form submit
    handleSubmit(event) {
        let cols, rows, mines, start;
        switch (this.state.difficulty) {
            // *** SETTINGS *** //
            case 1:  // EASY
                cols = 9;
                rows = 9;
                mines = 10;
                start = true;
                break;
            case 2:  // Normal
                cols = 16;
                rows = 16;
                mines = 40;
                start = true;
                break;
            case 3:  // Hard
                cols = 30;
                rows = 16;
                mines = 99;
                start = true;
                break;
            case 4:  // Custom
                if (this.state.rows && this.state.cols && this.state.mines) {  // a safe check that all fields are filled
                    start = true;
                    cols = this.state.rows;
                    rows = this.state.cols;
                    mines = this.state.mines;
                }
                break;
            default:
        }
        if (start) {
            this.setState({
                cols: cols,
                rows: rows,
                mines: mines,
                start: start,
            });
        }

        event.preventDefault();
    }

    // we render the page differently based on if we start the game or not
    render() {
        if (this.state.start) {  // render the game if we have start the game
            return(
                <div>
                    <Game
                        cols={this.state.cols}
                        rows={this.state.rows}
                        mines={this.state.mines}
                        difficulty={this.state.difficulty}
                    />
                </div>
            )
        }
        // render the setting form before start the game
        return (
            <form onSubmit={this.handleSubmit}>
                <div>
                    Difficulty:
                    <input type="radio" name="difficulty"
                               value="1"
                               checked={this.state.difficulty === 1}
                               onChange={this.handleChange} />{"Easy"}
                    <input type="radio" name="difficulty"
                               value="2"
                               checked={this.state.difficulty === 2}
                               onChange={this.handleChange} />{"Normal"}
                    <input type="radio" name="difficulty"
                               value="3"
                               checked={this.state.difficulty === 3}
                               onChange={this.handleChange} />{"Hard"}
                    <input type="radio" name="difficulty"
                               value="4"
                               checked={this.state.difficulty === 4}
                               onChange={this.handleChange} />{"Custom"}
                </div>
                <br/>
                <div>
                    Cols (between 3 and 50): <input type="number" name="cols" value={this.state.cols} min="3" max="50" onChange={this.handleChange} disabled={this.state.difficulty!==4}/><br/>
                    Rows (between 3 and 50): <input type="number" name="rows" value={this.state.rows} min="3" max="50" onChange={this.handleChange} disabled={this.state.difficulty!==4}/><br/>
                    Quantity (between 1 and the size): <input type="number" name="mines" value={this.state.mines} onChange={this.handleChange} min="1" max={this.state.cols * this.state.rows - 1} disabled={this.state.difficulty!==4}/>
                </div>
                <br/>
                <input type="submit" value="Start Game" />
            </form>
        );
    }
}

// ========================================
document.addEventListener('contextmenu', event => event.preventDefault());  // prevent right click menu
export default App;
