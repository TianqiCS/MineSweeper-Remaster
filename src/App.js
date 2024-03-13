import React from 'react';
//import logo from './logo.svg';
import './App.css';
import moment from "moment";
import {ConfigProvider, Col, InputNumber, Row, Slider, Radio, Tooltip, Button} from 'antd';

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
            timer: 0,  // the timer
            explodedIndex: null,  // the index of the exploded mine
        };
        this.timer = null;

    }

    // handle any clicks
    handleClick(i,e) {
        if (this.state.GameOver === -1) {  // if the game has not begun, we initialize the board and open the square
            this.initialize(i);
            this.timer = setInterval(()=>{
                this.setState({
                    timer: this.state.timer + 10,
                });

            }, 10);
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
                        squares[i] = "💣";
                    }
                }
                else if (this.state.isFlag[i]) {  // these squares are wrongly flagged
                    squares[i] = "❌";
                }
                if (i === this.state.explodedIndex) {  // the exploded mine
                    squares[i] = "💥";
                }
            }
        }
        if (this.state.GameOver === 2) {  // marks all mines as flagged when win
            for (let i = 0; i < this.state.cols * this.state.rows; i++) {
                if (this.state.isMine[i]) {
                    squares[i] = "🚩";
                }
            }
        }

        const timerDisplay = moment.duration(this.state.timer).asSeconds().toFixed(2);

        return (
            <div className="game">
                <Row>
                    <Col flex="auto" style={{'float': 'left'}}>
                        <h3>{"💣 " + this.state.remain}</h3>
                    </Col>
                    <Col flex="auto">
                        <Tooltip title={
                            <div>
                                <li>{"Left Button - OPEN"}</li>
                                <li>{"Right Button - FLAG"}</li>
                                <li>{"Middle Button - AUTO"}</li>
                            </div>
                        }><h3 style={{'textAlign': 'center'}}>{this.getStatus()}</h3></Tooltip>
                    </Col>
                    <Col flex="auto">
                        <h3 style={{'float': 'right'}}>⏱️ {timerDisplay}</h3>
                    </Col>
                </Row>
                <div className="game-board">
                    <Board
                        squares={squares}
                        isOpen={this.state.isOpen}
                        isFlag={this.state.isFlag}
                        isMine={this.state.isMine.slice().fill(0)}
                        settings={{rows: this.state.rows, cols: this.state.cols}}
                        onClick={(i, e) => this.handleClick(i, e)}
                    />
                </div>
                <br/>
                <input style={{
                    //set to center of the line
                    display: "flex",
                    margin: "auto",
                }} type="submit" value="Restart" onClick={Game.restart}/>
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
            explodedIndex: null,
            timer: 0,
        },() => {  // make sure we have set state first (Asynchronous !)
            this.open(index);
        });
    }

    // open the target square and it has consequence
    open(index) {
        if (!this.state.isOpen[index] && !this.state.isFlag[index]) {  // we don't open opened or flagged squares
            if (this.state.isMine[index]) {  // unluckily, the square is a mine, better luck next time
                this.setState({
                    explodedIndex: index,
                })
                this.gameover(1);
                clearInterval(this.timer);
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
                    this.gameover(2);
                    clearInterval(this.timer);
                    // Save the game to local storage
                    let data = JSON.parse(localStorage.getItem('leaderboard')) || [];
                    data.push({
                      time: new Date().toLocaleString(),
                      difficulty: this.props.difficulty,
                      timer: moment.duration(this.state.timer).asSeconds().toFixed(2),
                    });
                    // sort the data by timer
                    data.sort((a, b) => {
                      return a.timer - b.timer;
                    });
                    localStorage.setItem('leaderboard', JSON.stringify(data));
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
                squares[i] = "🚩";
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
        let data = JSON.parse(localStorage.getItem('leaderboard')) || [];
        this.state = {
            difficulty: 1,  // difficulty : 1 easy, 2 normal, 3 hard, 4 custom
            cols: 3,  // number of columns
            rows: 3,  // number or rows
            mines: 1,  // number of mines
            start: false,  // is the game started
            leaderboard: data,
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
                <ConfigProvider
                    theme={{
                        token: {
                            // Seed Token
                            colorPrimary: "#fa8c16",
                            colorInfo: "#fa8c16",
                            borderRadius: 4,
                            colorBgBase: "#ffdab9"
                        },
                    }}
                >
                    <Game
                        cols={this.state.cols}
                        rows={this.state.rows}
                        mines={this.state.mines}
                        difficulty={this.state.difficulty}
                    />
                </ConfigProvider>
            )
        }
        // render the setting form before start the game
        return (
            <ConfigProvider
                theme={{
                    token: {
                        // Seed Token
                        colorPrimary: "#fa8c16",
                        colorInfo: "#fa8c16",
                        borderRadius: 4,
                        colorBgBase: "#ffdab9"
                    },
                }}
            >
            <form onSubmit={this.handleSubmit}>
                <div style={{
                    fontSize: "1.5em",
                }}>
                    Difficulty&nbsp;&nbsp;&nbsp;
                    <Radio.Group size={"large"} defaultValue={1} value={this.state.difficulty} buttonStyle="solid"
                                 style={{borderRadius: "1px"}}
                                 onChange={(e) => {this.setState({difficulty: e.target.value})} // set the difficulty based on the radio button
                    }>
                        <Radio.Button value={1}>😇 Easy</Radio.Button>
                        <Radio.Button value={2}>😏 Normal</Radio.Button>
                        <Radio.Button value={3}>😮 Hard</Radio.Button>
                        <Radio.Button value={4}>😋 Custom</Radio.Button>
                    </Radio.Group>
                </div>
                <br/>
                <div hidden={this.state.difficulty!==4}>
                    <Row>
                        <Col span={6} style={{fontSize: "1.5em"}}>Rows &nbsp;&nbsp;&nbsp;</Col>
                        <Col span={12}>
                            <Slider
                                disabled={this.state.difficulty!==4}
                                min={3}
                                max={50}
                                onChange={(value) => this.setState({cols: value})}
                                value={this.state.cols}
                            />
                        </Col>
                        <Col span={4}>
                            <InputNumber
                                disabled={this.state.difficulty!==4}
                                min={3}
                                max={50}
                                style={{
                                    margin: '0 16px',
                                }}
                                onChange={(value) => this.setState({cols: value})}
                                value={this.state.cols}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col span={6} style={{fontSize: "1.5em"}}>Cols &nbsp;&nbsp;&nbsp;&nbsp;</Col>
                        <Col span={12}>
                            <Slider
                                disabled={this.state.difficulty!==4}
                                min={3}
                                max={50}
                                onChange={(value) => this.setState({rows: value})}
                                value={this.state.rows}
                            />
                        </Col>
                        <Col span={4}>
                            <InputNumber
                                disabled={this.state.difficulty!==4}
                                min={3}
                                max={50}
                                style={{
                                    margin: '0 16px',
                                }}
                                onChange={(value) => this.setState({rows: value})}
                                value={this.state.rows}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col span={6} style={{fontSize: "1.5em"}}>Mines &nbsp;&nbsp;</Col>
                        <Col span={12}>
                            <Slider
                                disabled={this.state.difficulty!==4}
                                min={3}
                                max={50}
                                onChange={(value) => this.setState({mines: value})}
                                value={this.state.mines}
                            />
                        </Col>
                        <Col span={4}>
                            <InputNumber
                                disabled={this.state.difficulty!==4}
                                min={1}
                                max={this.state.cols * this.state.rows - 1}
                                style={{
                                    margin: '0 16px',
                                }}
                                onChange={(value) => this.setState({mines: value})}
                                value={this.state.mines}
                            />
                        </Col>
                    </Row>
                </div>
                <br/>

                <input style={{
                    //set to center of the line
                    display: "flex",
                    margin: "auto",
                }} type="submit" value="Start Game" />

                <Leaderboard data={this.state.leaderboard}/>
            </form>
            </ConfigProvider>
        );
    }
}

// create a leaderboard component with local storage, data will be datetime, difficulty, and timer
// use antd row and col to make the leaderboard looks better
class Leaderboard extends React.Component {

    render() {
        if (this.props.data.length === 0) {
            return null;
        }

        return (
            <div style={{'textAlign': 'center'}}>
                <h2>Leaderboard</h2>
                <div>
                    <Row>
                        <Col span={8}><h3>DateTime</h3></Col>
                        <Col span={8}><h3>Difficulty</h3></Col>
                        <Col span={8}><h3>Timer</h3></Col>
                    </Row>
                    {this.props.data.map((item, index) => {
                        return (
                            <Row key={index}>
                                <Col span={8}>{moment(item.time).fromNow()}</Col>
                                <Col
                                    span={8}>{item.difficulty === 1 ? "Easy" : item.difficulty === 2 ? "Normal" : item.difficulty === 3 ? "Hard" : "Custom"}</Col>
                                <Col span={8}>{item.timer}</Col>
                            </Row>
                        )
                    })}
                </div>
                <br/>
                <Button type="primary" style={{
                    //set to center of the line
                    display: "flex",
                    margin: "auto",
                }} onClick={()=>{
                    localStorage.setItem('leaderboard', JSON.stringify([]));
                    window.location.reload();
                }}>Clear</Button>

            </div>
        )
    }
}


// ========================================
document.addEventListener('contextmenu', event => event.preventDefault());  // prevent right click menu
export default App;
