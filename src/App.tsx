import { useEffect, useRef, useState } from 'react';
import './App.css';
import { type } from 'os';

function useInterval(ms: number, callback: (diff: number) => void) {
  const callbackRef = useRef(callback)
  useEffect(function () {
    callbackRef.current = callback
  }, [callback])

  useEffect(function () {
    const start = Date.now()
    const interval = setInterval(function () {
      const end = Date.now()
      callbackRef.current(end-start)
    }, ms)
    return function () {
      clearInterval(interval)
    }
  }, [ms])
}

type Direction = "Up" | "Down" | "Left" | "Right"

interface PacmanProps {
  direction: Direction;
  radius: number;
  x: number;
  y: number;
}

function getRotation (direction: Direction): number {
  switch (direction) {
    case "Up": return 270
    case "Left": return 180
    case "Down": return 90
    case "Right": return 0
  }
}

function Pacman (props: PacmanProps) {
  const { direction, radius: r, x: cx, y: cy } = props
  const rotation = getRotation(direction)
  const [degrees, setDegrees] = useState(90)
  const radians = degrees * Math.PI / 180
  const dx = Math.cos(radians / 2) * r
  const dy = Math.sin(radians / 2) * r
  const f = 2
  useInterval(1000/50, function (diff) {
    const newDegrees = 45 * Math.sin(2 * Math.PI * f * diff / 1000) + 45
    setDegrees(newDegrees)
  })
  return(
    <path
      d={`M ${cx} ${cy} L ${cx+dx} ${cy-dy} A ${r} ${r} ${degrees} 1 0 ${cx+dx} ${cy+dy} z`}
      fill="yellow" 
      transform={`rotate(${rotation} ${cx} ${cy})`}
    />
  )
}

// 28 columns x 31 rows = 868 tiles
const level = [
  "╔════════════╕╒════════════╗",
  "║············││············║",
  "║·╭──╮·╭───╮·││·╭───╮·╭──╮·║",
  "║●│  │·│   │·││·│   │·│  │●║",
  "║·╰──╯·╰───╯·╰╯·╰───╯·╰──╯·║",
  "║··························║",
  "║·╭──╮·╭╮·╭──────╮·╭╮·╭──╮·║",
  "║·╰──╯·││·╰──╮╭──╯·││·╰──╯·║",
  "║······││····││····││······║",
  "╚════╗·│╰──╮ ││ ╭──╯│·╔════╝",
  "     ║·│╭──╯ ╰╯ ╰──╮│·║     ",
  "     ║·││          ││·║     ",
  "     ║·││ ╔══──══╗ ││·║     ",
  "═════╝·╰╯ ║      ║ ╰╯·╚═════",
  "}     ·   ║      ║   ·     {",
  "═════╗·╭╮ ║      ║ ╭╮·╔═════",
  "     ║·││ ╚══════╝ ││·║     ",
  "     ║·││  READY!  ││·║     ",
  "     ║·││ ╭──────╮ ││·║     ",
  "╔════╝·╰╯ ╰──╮╭──╯ ╰╯·╚════╗",
  "║············││············║",
  "║·╭──╮·╭───╮·││·╭───╮·╭──╮·║",
  "║·╰─╮│·╰───╯·╰╯·╰───╯·│╭─╯·║",
  "║●··││·······()·······││··●║",
  "╙─╮·││·╭╮·╭──────╮·╭╮·││·╭─╜",
  "╓─╯·╰╯·││·╰──╮╭──╯·││·╰╯·╰─╖",
  "║······││····││····││······║",
  "║·╭────╯╰──╮·││·╭──╯╰────╮·║",
  "║·╰────────╯·╰╯·╰────────╯·║",
  "║··························║",
  "╚══════════════════════════╝",
];

interface Node {
  x: number;
  y: number;
  up?: Node;
  down?: Node;
  left?: Node;
  right?: Node;
}

function szudzik(x: number, y: number) {
  return x < y ? x + y * y : x + x * x + y 
}

const movableGlyphs = "·●READY! (){}"

function buildGraph(start: Node, level: string[]) {
  const memo = new Map<number, Node>()
  const stack: Node[] = [start]
  const { x, y } = start
  memo.set(szudzik(x, y), start)

  while (stack.length > 0) {
    const node = stack.pop()!
    const { x, y } = node
    const neighbors: [Direction, [number, number]][] = [
      ["Up", [x, y - 1]],
      ["Left", [x - 1, y]],
      ["Right", [x + 1, y]],
      ["Down", [x, y + 1]]
    ];
    for (const [direction, [x, y]] of neighbors) {
      if (
        y >= 0 &&
        y < level.length &&
        x >= 0 &&
        x < level[y].length &&
        movableGlyphs.includes(level[y - 1][x - 1])
      ) {
        const pair = szudzik(x, y)
        const neighbor = memo.get(pair) ?? { x, y }
        memo.set(pair, neighbor)

        switch (direction) {
          case "Up": {
            if (node.up === undefined) {
              const inBetween: Node = { x, y: y + 0.5 }
              node.up = inBetween
              inBetween.down = node
              inBetween.up = neighbor
              neighbor.down = inBetween
              stack.push(neighbor)
            }
            break
          }
          case "Down": {
            if (node.down === undefined) {
              const inBetween: Node = { x, y: y - 0.5 }
              node.down = inBetween
              inBetween.up = node
              inBetween.down = neighbor
              neighbor.up = inBetween
              stack.push(neighbor)
            }
            break
          }
          case "Left": {
            if (node.left === undefined) {
              const inBetween: Node = { x: x + 0.5, y}
              node.left = inBetween
              inBetween.right = node
              inBetween.left = neighbor
              neighbor.right = inBetween
              stack.push(neighbor)
            }
            break
          }
          case "Right": {
            if (node.right === undefined) {
              const inBetween: Node = { x: x - 0.5, y}
              node.right = inBetween
              inBetween.left = node
              inBetween.right = neighbor
              neighbor.left = inBetween
              stack.push(neighbor)
            }
            break
          }
        }
      }
    }
  }

  const node = memo.get(szudzik(x, y))!
  return node.right
}

console.log(buildGraph(getStartNode(level), level))

function getStartNode(level: string[]): Node {
  type State = 
    | { status: "not-seen" }
    | { status: "saw-open"; x: number; y: number }
    | { status: "saw-both"; x: number; y: number }

  let state: State = { status: "not-seen" }
  let row = 0
  for (const line of level) {
    row = row + 1
    let column = 0
    for (const glyph of line) {
      column = column + 1
      switch (state.status) {
        case "not-seen": {
          switch (glyph) {
            case "(": {
              state = { status: "saw-open", x: column, y: row }
              break
            }
            case ")": {
              throw new Error("Expected `(` but saw `)`.")
            }
          }
          break
        }
        case "saw-open": {
          switch (glyph) {
            case ")": {
              state = { status: "saw-both", x: state.x, y: state.y }
              break
            }
            default: {
              throw new Error(`Expected \`)\` but saw \`${glyph}\``)
            }
          }
          break
        }
        case "saw-both": {
          switch (glyph) {
            case "(":
            case ")": {
              throw new Error("Expected any glyph except `(` and `)`.")
            }
          }
          break
        }
      }
    }
  }

  switch (state.status) {
    case "not-seen": 
    case "saw-open": {
      throw new Error("Expected to see `()`.")
    }
    case "saw-both": {
      return { x: state.x, y: state.y }
    }
  }
}

interface TileProps {
  glyph: string;
  length: number;
  x: number;
  y: number;
}

function Tile (props: TileProps) {
  const { glyph, length, x, y } = props;

  switch (glyph) {
    case "╔":
      return (
        <path 
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${y + length / 2} ${x + length} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "═":
      return (
        <line
          x1={x}
          y1={y + length / 2}
          x2={x + length}
          y2={y + length / 2}
          strokeWidth={length * 0.1}
          stroke="black"
        />
      );
    case "╕":
      return (
        <path 
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${y + length / 2} ${x} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╒":
      return (
        <path 
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${y + length / 2} ${x + length} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╗":
      return (
        <path 
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${y + length / 2} ${x} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "║":
      return (
        <line
          x1={x + length / 2}
          y1={y}
          x2={x + length / 2}
          y2={y + length}
          strokeWidth={length * 0.1}
          stroke="black"
        />
      );
    case "·":
      return (
        <circle 
          cx={x + length / 2} 
          cy={y + length / 2} 
          r={length * 0.1} 
        />
      );
    case "│":
      return (
        <line
          x1={x + length / 2}
          y1={y}
          x2={x + length / 2}
          y2={y + length}
          strokeWidth={length * 0.1}
          stroke="black"
        />
      );
    case "╭":
      return (
        <path 
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${y + length / 2} ${x + length} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "─":
      return (
        <line
          x1={x}
          y1={y + length / 2}
          x2={x + length}
          y2={y + length / 2}
          strokeWidth={length * 0.1}
          stroke="black"
        />
      );
    case "╮":
      return (
        <path 
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${y + length / 2} ${x} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "●":
      return (
        <circle 
          cx={x + length / 2} 
          cy={y + length / 2} 
          r={length * 0.3} 
        />
      );
    case "╰":
      return (
        <path 
          d={`M ${x + length / 2} ${y} Q ${x + length / 2} ${y + length / 2} ${x + length} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╯":
      return (
        <path 
          d={`M ${x + length / 2} ${y} Q ${x + length / 2} ${y + length / 2} ${x} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╚":
      return (
        <path 
          d={`M ${x + length / 2} ${y} Q ${x + length / 2} ${y + length / 2} ${x + length} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╝":
      return (
        <path 
          d={`M ${x + length / 2} ${y} Q ${x + length / 2} ${y + length / 2} ${x} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "R":
      return <text x={x + length / 2} y={y + length / 2} textLength={length}>R</text>;
    case "E":
      return <text x={x + length / 2} y={y + length / 2} textLength={length}>E</text>;
    case "A":
      return <text x={x + length / 2} y={y + length / 2} textLength={length}>A</text>;
    case "D":
      return <text x={x + length / 2} y={y + length / 2} textLength={length}>D</text>;
    case "Y":
      return <text x={x + length / 2} y={y + length / 2} textLength={length}>Y</text>;
    case "!":
      return <text x={x + length / 2} y={y + length / 2} textLength={length}>!</text>;
    case "╙":
      return (
        <path 
          d={`M ${x + length / 2} ${y} Q ${x + length / 2} ${y + length / 2} ${x + length} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╜":
      return (
        <path 
          d={`M ${x + length / 2} ${y} Q ${x + length / 2} ${y + length / 2} ${x} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╓":
      return (
        <path 
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${y + length / 2} ${x + length} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╖":
      return (
        <path 
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${y + length / 2} ${x} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case " ":
      return null;
    case "(":
      return null;
    case ")":
      return null;
    case "{":
      return null;
    case "}":
      return null;
    default:
      throw new Error(`Unrecognized glyph: ${JSON.stringify(glyph)}`);
  }
}

interface LevelProps {
  level: string[];
  length: number;
}

function Level(props: LevelProps) {
  const { level, length } = props

  return (
    <>
      {level.flatMap(function (line, lineNumber) {
        return Array.from(line, function (glyph, columnNumber) {
          return (
            <Tile 
              glyph={glyph} 
              length={length} 
              x={columnNumber * length} 
              y={lineNumber * length} 
            />
          )
        })
      } )}
    </>
  )
}

function App() {
  const [up, setUp] = useState(false)
  const [down, setDown] = useState(false)
  const [left, setLeft] = useState(false)
  const [right, setRight] = useState(false)
  const [X, setX] = useState(120)
  const [Y, setY] = useState(180)
  const [direction, setDirection] = useState<Direction>("Up")
  
  useInterval(1000/30, function() {
    if (up) {
      setDirection("Up")
      setY((y) => y-10)
    }
    if (down) {
      setDirection("Down")
      setY((y) => y+10)
    }
    if (left) {
      setDirection("Left")
      setX((x) => x-10)
    }
    if (right) {
      setDirection("Right")
      setX((x) => x+10)
    }
  })

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    
    switch (event.key) {
      case "ArrowUp":
        setUp(true)
        break
      case "ArrowDown":
        setDown(true)
        break
      case "ArrowLeft":
        setLeft(true)
        break
      case "ArrowRight":
        setRight(true)
        break
    }
  }

  function handleKeyUp(event: React.KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowUp":
        setUp(false)
        break
      case "ArrowDown":
        setDown(false)
        break
      case "ArrowLeft":
        setLeft(false)
        break
      case "ArrowRight":
        setRight(false)
        break
    }
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <svg 
        id="pacman"
        viewBox="0 0 560 620"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
      >

        <Level level={level} length={20} />
              
        <Pacman direction={direction} radius={12.5} x={X} y={Y}/>
      </svg>
    </div>
  )
}

export default App;
