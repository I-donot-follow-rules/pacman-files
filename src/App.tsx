import { useEffect, useRef, useState } from "react";
import "./App.css";
import { createEmitAndSemanticDiagnosticsBuilderProgram } from "typescript";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function useInterval(ms: number, callback: (diff: number) => void) {
  const callbackRef = useRef(callback);
  useEffect(
    function () {
      callbackRef.current = callback;
    },
    [callback]
  );

  useEffect(
    function () {
      const start = Date.now();
      const interval = setInterval(function () {
        const end = Date.now();
        callbackRef.current(end - start);
      }, ms);
      return function () {
        clearInterval(interval);
      };
    },
    [ms]
  );
}

type Direction = "up" | "down" | "left" | "right";

interface PacmanProps {
  direction: Direction;
  radius: number;
  x: number;
  y: number;
}

function getRotation(direction: Direction): number {
  switch (direction) {
    case "up":
      return 270;
    case "left":
      return 180;
    case "down":
      return 90;
    case "right":
      return 0;
  }
}

function Pacman(props: PacmanProps) {
  const { direction, radius: r, x: cx, y: cy } = props;
  const rotation = getRotation(direction);
  const [degrees, setDegrees] = useState(90);
  const radians = (degrees * Math.PI) / 180;
  const dx = Math.cos(radians / 2) * r;
  const dy = Math.sin(radians / 2) * r;
  const f = 2;
  useInterval(1000 / 50, function (diff) {
    const newDegrees = 45 * Math.sin((2 * Math.PI * f * diff) / 1000) + 45;
    setDegrees(newDegrees);
  });
  return (
    <path
      d={`M ${cx} ${cy} L ${cx + dx} ${cy - dy} A ${r} ${r} ${degrees} 1 0 ${
        cx + dx
      } ${cy + dy} z`}
      fill="yellow"
      transform={`rotate(${rotation} ${cx} ${cy})`}
    />
  );
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
  return x < y ? x + y * y : x + x * x + y;
}

const movableGlyphs = "·●READY! (){}";

function buildGraph(start: Node, level: string[]): Node {
  const memo = new Map<number, Node>();
  const stack: Node[] = [start];
  const { x, y } = start;
  memo.set(szudzik(x - 1, y - 1), start);
  let leftPortal: Node | undefined;
  let rightPortal: Node | undefined;

  while (stack.length > 0) {
    const node = stack.pop()!;
    const { x, y } = node;
    const neighbors: [Direction, [number, number]][] = [
      ["up", [x, y - 1]],
      ["left", [x - 1, y]],
      ["right", [x + 1, y]],
      ["down", [x, y + 1]],
    ];
    for (const [direction, [x, y]] of neighbors) {
      if (
        y >= 1 &&
        y <= level.length &&
        x >= 1 &&
        x <= level[y - 1].length &&
        movableGlyphs.includes(level[y - 1][x - 1])
      ) {
        const pair = szudzik(x - 1, y - 1);
        const neighbor = memo.get(pair) ?? { x, y };
        memo.set(pair, neighbor);

        const glyph = level[y - 1][x - 1];

        switch (glyph) {
          case "{": {
            assert(rightPortal === undefined, "Expected only one right portal");
            rightPortal = neighbor;
            break;
          }
          case "}": {
            assert(leftPortal === undefined, "Expected only one left portal");
            leftPortal = neighbor;
            break;
          }
        }

        switch (direction) {
          case "up": {
            if (node.up === undefined) {
              const inBetween: Node = { x, y: y + 0.5 };
              node.up = inBetween;
              inBetween.down = node;
              inBetween.up = neighbor;
              neighbor.down = inBetween;
              stack.push(neighbor);
            }
            break;
          }
          case "down": {
            if (node.down === undefined) {
              const inBetween: Node = { x, y: y - 0.5 };
              node.down = inBetween;
              inBetween.up = node;
              inBetween.down = neighbor;
              neighbor.up = inBetween;
              stack.push(neighbor);
            }
            break;
          }
          case "left": {
            if (node.left === undefined) {
              const inBetween: Node = { x: x + 0.5, y };
              node.left = inBetween;
              inBetween.right = node;
              inBetween.left = neighbor;
              neighbor.right = inBetween;
              stack.push(neighbor);
            }
            break;
          }
          case "right": {
            if (node.right === undefined) {
              const inBetween: Node = { x: x - 0.5, y };
              node.right = inBetween;
              inBetween.left = node;
              inBetween.right = neighbor;
              neighbor.left = inBetween;
              stack.push(neighbor);
            }
            break;
          }
        }
      }
    }
  }

  assert(
    leftPortal !== undefined && rightPortal !== undefined,
    "Expected both portals to be defined"
  );

  const portal: Node = { x: leftPortal.x - 0.5, y: leftPortal.y };
  leftPortal.left = portal;
  rightPortal.right = portal;
  portal.right = leftPortal;
  portal.left = rightPortal;

  const node = memo.get(szudzik(x - 1, y - 1))!;
  assert(node.right !== undefined, "expected node.right to be defined");
  return node.right;
}

function getStartNode(level: string[]): Node {
  type State =
    | { status: "not-seen" }
    | { status: "saw-open"; x: number; y: number }
    | { status: "saw-both"; x: number; y: number };

  let state: State = { status: "not-seen" };
  let row = 0;
  for (const line of level) {
    row = row + 1;
    let column = 0;
    for (const glyph of line) {
      column = column + 1;
      switch (state.status) {
        case "not-seen": {
          switch (glyph) {
            case "(": {
              state = { status: "saw-open", x: column, y: row };
              break;
            }
            case ")": {
              throw new Error("Expected `(` but saw `)`.");
            }
          }
          break;
        }
        case "saw-open": {
          switch (glyph) {
            case ")": {
              state = { status: "saw-both", x: state.x, y: state.y };
              break;
            }
            default: {
              throw new Error(`Expected \`)\` but saw \`${glyph}\``);
            }
          }
          break;
        }
        case "saw-both": {
          switch (glyph) {
            case "(":
            case ")": {
              throw new Error("Expected any glyph except `(` and `)`.");
            }
          }
          break;
        }
      }
    }
  }

  switch (state.status) {
    case "not-seen":
    case "saw-open": {
      throw new Error("Expected to see `()`.");
    }
    case "saw-both": {
      return { x: state.x, y: state.y };
    }
  }
}

interface TileProps {
  glyph: string;
  length: number;
  x: number;
  y: number;
  started: boolean;
}

function Tile(props: TileProps) {
  const { glyph, length, x, y, started } = props;

  switch (glyph) {
    case "╔":
      return (
        <path
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${
            y + length / 2
          } ${x + length} ${y + length / 2}`}
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
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${
            y + length / 2
          } ${x} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╒":
      return (
        <path
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${
            y + length / 2
          } ${x + length} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╗":
      return (
        <path
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${
            y + length / 2
          } ${x} ${y + length / 2}`}
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
        <circle cx={x + length / 2} cy={y + length / 2} r={length * 0.1} />
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
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${
            y + length / 2
          } ${x + length} ${y + length / 2}`}
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
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${
            y + length / 2
          } ${x} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "●":
      return (
        <circle cx={x + length / 2} cy={y + length / 2} r={length * 0.3} />
      );
    case "╰":
      return (
        <path
          d={`M ${x + length / 2} ${y} Q ${x + length / 2} ${y + length / 2} ${
            x + length
          } ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╯":
      return (
        <path
          d={`M ${x + length / 2} ${y} Q ${x + length / 2} ${
            y + length / 2
          } ${x} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╚":
      return (
        <path
          d={`M ${x + length / 2} ${y} Q ${x + length / 2} ${y + length / 2} ${
            x + length
          } ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╝":
      return (
        <path
          d={`M ${x + length / 2} ${y} Q ${x + length / 2} ${
            y + length / 2
          } ${x} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "R":
      return started ? null : (
        <text x={x + length / 2} y={y + length / 2} textLength={length}>
          R
        </text>
      );
    case "E":
      return started ? null : (
        <text x={x + length / 2} y={y + length / 2} textLength={length}>
          E
        </text>
      );
    case "A":
      return started ? null : (
        <text x={x + length / 2} y={y + length / 2} textLength={length}>
          A
        </text>
      );
    case "D":
      return started ? null : (
        <text x={x + length / 2} y={y + length / 2} textLength={length}>
          D
        </text>
      );
    case "Y":
      return started ? null : (
        <text x={x + length / 2} y={y + length / 2} textLength={length}>
          Y
        </text>
      );
    case "!":
      return started ? null : (
        <text x={x + length / 2} y={y + length / 2} textLength={length}>
          !
        </text>
      );
    case "╙":
      return (
        <path
          d={`M ${x + length / 2} ${y} Q ${x + length / 2} ${y + length / 2} ${
            x + length
          } ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╜":
      return (
        <path
          d={`M ${x + length / 2} ${y} Q ${x + length / 2} ${
            y + length / 2
          } ${x} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╓":
      return (
        <path
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${
            y + length / 2
          } ${x + length} ${y + length / 2}`}
          strokeWidth={length * 0.1}
          stroke="black"
          fill="transparent"
        />
      );
    case "╖":
      return (
        <path
          d={`M ${x + length / 2} ${y + length} Q ${x + length / 2} ${
            y + length / 2
          } ${x} ${y + length / 2}`}
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
  started: boolean;
}

function Level(props: LevelProps) {
  const { level, length, started } = props;

  return (
    <>
      {level.flatMap(function (line, lineNumber) {
        return Array.from(line, function (glyph, columnNumber) {
          return (
            <Tile
              key={szudzik(columnNumber, lineNumber)}
              glyph={glyph}
              length={length}
              x={columnNumber * length}
              y={lineNumber * length}
              started={started}
            />
          );
        });
      })}
    </>
  );
}

function updateLevel(
  lineNumber: number,
  columnNumber: number,
  level: string[]
) {
  const newLevel: string[] = level.map((line, row) => {
    if (row === lineNumber) {
      return `${line.slice(0, columnNumber)} ${line.slice(columnNumber + 1)}`;
    } else {
      return line;
    }
  });
  return newLevel;
}

function getStartNodeBlinky(level: string[]): Node {
  const pattern = "═──═";
  let lineNumber = 0;
  for (const line of level) {
    const columnNumber = line.indexOf(pattern);
    if (columnNumber >= 0) {
      const x = columnNumber + 2.5;
      const y = lineNumber;
      return { x, y };
    }
    lineNumber = lineNumber + 1;
  }
  throw new Error("Expected a ghost area");
}

function distance(start: Node, end: Node): number {
  const x = start.x - end.x;
  const y = start.y - end.y;
  return Math.sqrt(x ** 2 + y ** 2);
}

function findNode(start: Node, end: Node): Node {
  const openSet = [start];
  const gScore = new WeakMap<Node, number>();
  const fScore = new WeakMap<Node, number>();

  gScore.set(start, 0);
  fScore.set(start, distance(start, end));

  while (openSet.length > 0) {
    const current = openSet.shift();
    assert(current !== undefined, "Expected currentNode to be defined");
    if (current.x === end.x && current.y === end.y) {
      return current;
    }
    const neighbors = [current.up, current.down, current.left, current.right];
    for (const neighbor of neighbors) {
      if (neighbor !== undefined) {
        const score = gScore.get(current)! + 0.5;
        const oldScore = gScore.get(neighbor) ?? Number.POSITIVE_INFINITY;
        if (score < oldScore) {
          gScore.set(neighbor, score);
          fScore.set(neighbor, score + distance(neighbor, end));
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
            openSet.sort((a, b) => {
              return fScore.get(a)! - fScore.get(b)!;
            });
          }
        }
      }
    }
  }

  throw new Error("Expected to find the end node");
}

const initialNode = buildGraph(getStartNode(level), level);

const initialNodeBlinky = findNode(initialNode, getStartNodeBlinky(level));

const food = "·●";

function App() {
  const [currentLevel, setCurrentLevel] = useState(level);
  const [node, setNode] = useState(initialNode);
  const [blinkyNode, setBlinkyNode] = useState(initialNodeBlinky);
  const blinkyX = 20 * (blinkyNode.x - 0.5) - 12.5;
  const blinkyY = 20 * (blinkyNode.y - 0.5) - 12.5;
  const x = 20 * (node.x - 0.5);
  const y = 20 * (node.y - 0.5);
  const [direction, setDirection] = useState<Direction | undefined>();
  const nextDirectionRef = useRef<Direction | undefined>();

  function updateNode(newNode: Node) {
    setNode(newNode);
    const nextDirection = nextDirectionRef.current;
    if (nextDirection !== undefined && newNode[nextDirection] !== undefined) {
      setDirection(nextDirection);
      nextDirectionRef.current = undefined;
    }
  }

  useInterval(1000 / 15, function () {
    switch (direction) {
      case "up": {
        if (node.up !== undefined) {
          updateNode(node.up);
          const x = Math.round(node.up.x) - 1;
          const y = Math.floor(node.up.y) - 1;
          if (food.includes(currentLevel[y][x])) {
            const newLevel = updateLevel(y, x, currentLevel);
            setCurrentLevel(newLevel);
          }
        }
        break;
      }
      case "down": {
        if (node.down !== undefined) {
          updateNode(node.down);
          const x = Math.round(node.down.x) - 1;
          const y = Math.ceil(node.down.y) - 1;
          if (food.includes(currentLevel[y][x])) {
            const newLevel = updateLevel(y, x, currentLevel);
            setCurrentLevel(newLevel);
          }
        }
        break;
      }
      case "left": {
        if (node.left !== undefined) {
          updateNode(node.left);
          const x = Math.floor(node.left.x) - 1;
          const y = Math.round(node.left.y) - 1;
          if (food.includes(currentLevel[y][x])) {
            const newLevel = updateLevel(y, x, currentLevel);
            setCurrentLevel(newLevel);
          }
        }
        break;
      }
      case "right": {
        if (node.right !== undefined) {
          updateNode(node.right);
          const x = Math.ceil(node.right.x) - 1;
          const y = Math.round(node.right.y) - 1;
          if (food.includes(currentLevel[y][x])) {
            const newLevel = updateLevel(y, x, currentLevel);
            setCurrentLevel(newLevel);
          }
        }
        break;
      }
    }
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "ArrowUp":
          if (node.up !== undefined) {
            setDirection("up");
          } else {
            nextDirectionRef.current = "up";
          }
          break;
        case "ArrowDown":
          if (node.down !== undefined) {
            setDirection("down");
          } else {
            nextDirectionRef.current = "down";
          }
          break;
        case "ArrowLeft":
          if (node.left !== undefined) {
            setDirection("left");
          } else {
            nextDirectionRef.current = "left";
          }
          break;
        case "ArrowRight":
          if (node.right !== undefined) {
            setDirection("right");
          } else {
            nextDirectionRef.current = "right";
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [node]);

  return (
    <svg
      id="pacman"
      viewBox="0 0 560 620"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
    >
      <Level
        level={currentLevel}
        length={20}
        started={direction !== undefined}
      />

      <Pacman direction={direction ?? "left"} radius={12.5} x={x} y={y} />
      <image href="red-ghost.png" x={blinkyX} y={blinkyY} width={25} />
    </svg>
  );
}

export default App;
