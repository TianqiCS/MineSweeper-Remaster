import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';

class Square extends React.Component {
    render() {
        return (
            <button className="square" disabled={this.props.isOpen && this.props.value === null} name={this.props.value} onMouseUp={this.props.onClick}>
                {this.props.value}
            </button>
        );
    }
}

class Board extends React.Component {
    renderSquare(i) {
        return (
            <Square
                isFlag={this.props.isFlag[i]}  // can be deleted
                isMine={this.props.isMine[i]}  // can be deleted
                isOpen={this.props.isOpen[i]}
                value={this.props.squares[i]}
                onClick={(e) => this.props.onClick(i,e)}
                key={i}
            />
        );
    }

    renderRow(index) {
        let row = [];
        for (let i = 0; i < this.props.settings.cols; i++) {
            row.push(this.renderSquare(i+this.props.settings.cols*index));
        }
        return row
    }

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

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            history: [{
                squares: Array(this.props.cols * this.props.rows).fill(null),
            }],
            isMine: Array(this.props.rows * this.props.cols).fill(0),
            isOpen: Array(this.props.rows * this.props.cols).fill(0),
            isFlag: Array(this.props.rows * this.props.cols).fill(0),
            xIsNext: true,
            GameOver: -1,
            rows: this.props.rows,
            cols: this.props.cols,
            mines: this.props.mines,
            remain: this.props.mines,
        };

    }

    handleClick(i,e) {
        if (this.state.GameOver === -1) {
            this.initilize(i);
            this.open(i);

        }
        else if (!this.state.GameOver && e.nativeEvent.which === 1) {
          this.open(i)

        }
        else if (!this.state.GameOver && e.nativeEvent.which === 3) {
          this.flag(i)
        }
        else if (!this.state.GameOver && e.nativeEvent.which === 2) {
          this.try(i)
        }
    }

    try(index) {
        const history = this.state.history;
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        if (this.state.isOpen[index]) {
            let up = false;
            let down = false;
            let left = false;
            let right = false;
            let sum = 0;

            if (index % this.state.cols) {
                if (this.state.isFlag[index - 1]) {
                    sum += 1;
                }
                left = true;
            }
            if (index % this.state.cols !== this.state.cols-1) {
                if (this.state.isFlag[index + 1]) {
                    sum += 1;
                }
                right = true;
            }
            if (index - this.state.cols >= 0) {
                if (this.state.isFlag[index - this.state.cols]) {
                    sum += 1;
                }
                up = true;
            }
            if (index + this.state.cols < this.state.cols * this.state.rows) {
                if (this.state.isFlag[index + this.state.cols]) {
                    sum += 1;
                }
                down = true;
            }

            if (up && left) {
                if (this.state.isFlag[index - 1 - this.state.cols]) {
                    sum += 1;
                }
            }
            if (up && right) {
                if (this.state.isFlag[index + 1 - this.state.cols]) {
                    sum += 1;
                }
            }
            if (down && left) {
                if (this.state.isFlag[index - 1 + this.state.cols]) {
                    sum += 1;
                }
            }
            if (down && right) {
                if (this.state.isFlag[index + 1 + this.state.cols]) {
                    sum += 1;
                }
            }

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

    flag(i) {
        const history = this.state.history;
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        const isFlag = this.state.isFlag.slice();
        if (!this.state.isOpen[i]) {
            isFlag[i] = !isFlag[i];
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
                history: [{
                    squares: squares,
                }],
                remain: this.state.remain - result,
            })
        }
    }
    componentDidMount() {
        const self = this;
        this.interval = setInterval(function() {
            self.setState({
                now: new Date(),
            });
        }, 1000);
    }

    render() {
        const history = this.state.history;
        const current = history[history.length - 1];

        if (this.state.GameOver === 1) {
            for (let i = 0; i < this.state.cols * this.state.rows; i++) {
                if (this.state.isMine[i]) {
                    if (!this.state.isFlag[i]) {
                        current.squares[i] = "@";
                    }
                }
                else if (this.state.isFlag[i]) {
                    current.squares[i] = "X";
                }
            }
        }
        if (this.state.GameOver === 2) {
            for (let i = 0; i < this.state.cols * this.state.rows; i++) {
                if (this.state.isMine[i]) {
                    current.squares[i] = "P";
                }
            }
        }
        return (
            <div className="game">
                <div className="game-board">
                    <Board
                        squares={current.squares}
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
                </div>
            </div>
        );
    }

    check() {
        return this.state.mines >= this.state.rows * this.state.cols;
    }

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

    initilize(index) {
        const size = this.state.rows * this.state.cols;
        for (let i=0; i < this.state.mines; i++) {
            let mine = Math.floor(Math.random() * size);
            if (mine === index || this.state.isMine[mine] === 1) {
                i--;
            }
            else {
                this.state.isMine[mine] = 1;
            }
        }
        let isOpen = Array(this.state.cols * this.state.rows).fill(0);
        this.setState({
            isOpen: isOpen,
            GameOver: 0,
        });
    }

    open(index) {
        if (!this.state.isOpen[index] && !this.state.isFlag[index]) {
            if (this.state.isMine[index]) {
                this.gameover(1);
            }
            else {
                this.calculate(index);
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

    gameover(mode) {
      this.setState({
        GameOver: mode,
      });
    }

    calculate(index) {
        if (!this.state.isOpen[index] && !this.state.isFlag[index]) {

            let up = false;
            let down = false;
            let left = false;
            let right = false;

            let sum = 0;

            if (this.state.isMine[index]) {
              return 1;
            }

            else {
                const history = this.state.history;
                const current = history[history.length - 1];
                const squares = current.squares;
                const isOpen = this.state.isOpen;
                if (index % this.state.cols) {
                    if (this.state.isMine[index - 1]) {
                        sum += 1;
                    }
                    left = true;
                }
                if (index % this.state.cols !== this.state.cols-1) {
                    if (this.state.isMine[index + 1]) {
                        sum += 1;
                    }
                    right = true;
                }
                if (index - this.state.cols >= 0) {
                    if (this.state.isMine[index - this.state.cols]) {
                        sum += 1;
                    }
                    up = true;
                }
                if (index + this.state.cols < this.state.cols * this.state.rows) {
                    if (this.state.isMine[index + this.state.cols]) {
                        sum += 1;
                    }
                    down = true;
                }

                if (up && left) {
                    if (this.state.isMine[index - 1 - this.state.cols]) {
                        sum += 1;
                    }
                }
                if (up && right) {
                    if (this.state.isMine[index + 1 - this.state.cols]) {
                        sum += 1;
                    }
                }
                if (down && left) {
                    if (this.state.isMine[index - 1 + this.state.cols]) {
                        sum += 1;
                    }
                }
                if (down && right) {
                    if (this.state.isMine[index + 1 + this.state.cols]) {
                        sum += 1;
                    }
                }
                if (sum) {squares[index] = sum;}
                isOpen[index] = true;
                this.setState({
                    isOpen: isOpen,
                    history: history.concat([{
                        squares: squares
                    }]),
                });

                if (sum) {
                  return sum;
                }
                else {
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
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            difficulty: 1,
            cols: null,
            rows: null,
            mines: null,
            start: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({[event.target.name]: parseInt(event.target.value)});
    }

    handleSubmit(event) {
        let cols, rows, mines, start;
        switch (this.state.difficulty) {
            case 1:
                cols = 9;
                rows = 9;
                mines = 10;
                start = true;
                break;
            case 2:
                cols = 16;
                rows = 16;
                mines = 40;
                start = true;
                break;
            case 3:
                cols = 30;
                rows = 16;
                mines = 99;
                start = true;
                break;
            case 4:
                if (this.state.rows && this.state.cols && this.state.mines) {
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

    render() {
        if (this.state.start) {
            return(
                <Game
                    cols={this.state.cols}
                    rows={this.state.rows}
                    mines={this.state.mines}
                    difficulty={this.state.difficulty}
                />
            )
        }
        return (
            <form onSubmit={this.handleSubmit}>
                <div>
                    Difficulty:
                    <td><input type="radio" name="difficulty"
                               value="1"
                               checked={this.state.difficulty === 1}
                               onChange={this.handleChange} />{"Easy"}</td>
                    <td><input type="radio" name="difficulty"
                               value="2"
                               checked={this.state.difficulty === 2}
                               onChange={this.handleChange} />{"Normal"}</td>
                    <td><input type="radio" name="difficulty"
                               value="3"
                               checked={this.state.difficulty === 3}
                               onChange={this.handleChange} />{"Hard"}</td>
                    <td><input type="radio" name="difficulty"
                               value="4"
                               checked={this.state.difficulty === 4}
                               onChange={this.handleChange} />{"Custom"}</td>
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
document.addEventListener('contextmenu', event => event.preventDefault());
export default App;
