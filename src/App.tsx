import { useEffect, useRef, useState } from 'react';
import './App.css';

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
       " ·   ║      ║   ·      ",
  "═════╗·╭╮ ║      ║ ╭╮·╔═════",
  "     ║·││ ╚══════╝ ││·║     ",
  "     ║·││  READY!  ││·║     ",
  "     ║·││ ╭──────╮ ││·║     ",
  "╔════╝·╰╯ ╰──╮╭──╯ ╰╯·╚════╗",
  "║············││············║",
  "║·╭──╮·╭───╮·││·╭───╮·╭──╮·║",
  "║·╰─╮│·╰───╯·╰╯·╰───╯·│╭─╯·║",
  "║●··││·······  ·······││··●║",
  "╙─╮·││·╭╮·╭──────╮·╭╮·││·╭─╜",
  "╓─╯·╰╯·││·╰──╮╭──╯·││·╰╯·╰─╖",
  "║······││····││····││······║",
  "║·╭────╯╰──╮·││·╭──╯╰────╮·║",
  "║·╰────────╯·╰╯·╰────────╯·║",
  "║··························║",
  "╚══════════════════════════╝",
];


function App() {
  const [up, setUp] = useState(false)
  const [down, setDown] = useState(false)
  const [left, setLeft] = useState(false)
  const [right, setRight] = useState(false)
  const [X, setX] = useState(120)
  const [Y, setY] = useState(180)
  const [direction, setDirection] = useState<Direction>("Up")
  
  useInterval(1000/50, function() {
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
        viewBox="0 0 500 500" 
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
      >
        <Pacman direction={direction} radius={20} x={X} y={Y}/>
      </svg>
    </div>
  )
}

export default App;
