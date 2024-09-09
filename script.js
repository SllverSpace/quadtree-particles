
utils.setup()
utils.setStyles()

var delta = 0
var lastTime = 0
var su = 0

var gs = [
    // [1, 1, -1],
    // [-1, 1, -1],
    // [-1, -1, -1]
]

let tseed = 0

function srand(seed) {
    return function() {
        let x = Math.sin(seed*3902+7459)*Math.cos(seed*4092+4829)*10000
        seed += 1
	    return x - Math.floor(x)
    }
}

let rng = srand(Math.random()*1000000000)
let colours = 10

for (let i = 0; i < colours; i++) {
    let g = []
    for (let j = 0; j < colours; j++) {
        g.push(Math.round(rng())*2-1)
    }
    gs.push(g)
}

var useQuadtree = true

var spawnRange = 1000

let minx = -spawnRange/2
let miny = -spawnRange/2
let maxx = spawnRange/2
let maxy = spawnRange/2

var ticks = 0
var targetTicks = 0

var timewarp = false
var debug = false
var debug2 = false
var debug3 = false

var fetchRange = 200

var drawTime = 0

var fps = 0
var tps = 0
var fps2 = 0
var tps2 = 0
var found = []
var quadtree = new Quadtree(0, 0, spawnRange, spawnRange)
var particles = []
for (let i = 0; i < 1000; i++) {
    let p = new Point(rng()*spawnRange-spawnRange/2, rng()*spawnRange-spawnRange/2, i, Math.floor(rng()*gs.length))
    quadtree.insert(p)
    particles.push(p)
}

var camera = {x: 0, y: 0, zoom: 0.5}

function tsc(x, y) {
    return [(x-camera.x)*camera.zoom+canvas.width/2, (y-camera.y)*camera.zoom+canvas.height/2]
}

function force(r, a) {
    let beta = 0.2
	if (r < beta) {
		return r / beta - 1
	} else if (beta < r && r < 1) {
		return a * (1 - Math.abs(2 * r - 1 - beta) / (1 - beta))
	} else {
		return 0
	}
}

function tick() {
    let forceFactor = 10
    let frictionHalfLife = 0.040
    let dt = 0.02
    let rMax = 100
    let frictionFactor = Math.pow(0.5, dt / frictionHalfLife)

    // if (mouse.ldown) {
    //     let i = Math.floor(Math.random()*particles.length)
    //     particles[i].x = (mouse.x-canvas.width/2)/camera.zoom + camera.x
    //     particles[i].y = (mouse.y-canvas.height/2)/camera.zoom + camera.y
    // }

    let midx = minx + (maxx-minx)/2
    let midy = miny + (maxy-miny)/2


    let collapse = 0

    // minx += (midx - minx) * collapse
    // maxx += (midx - maxx) * collapse
    // miny += (midy - miny) * collapse
    // maxy += (midy - maxy) * collapse

    
    minx *= (1-collapse)
    miny *= (1-collapse)
    maxx *= (1-collapse)
    maxy *= (1-collapse)

    let currenti = 0
    for (let p of particles) {
        if (currenti < particlei) {
            currenti += 1
            continue
        }
        let p2s = p.getQt().getPoints(p.x, p.y, fetchRange, fetchRange)
        let tx = 0
        let ty = 0
        for (let p2 of p2s) {
            let dx = p2.x - p.x
            let dy = p2.y - p.y
            let d = Math.sqrt(dx**2 + dy**2)
            if (d > 0 && d < rMax) {
                let f = force(d / rMax, gs[p.type][p2.type])
                tx += dx / d * f
                ty += dy / d * f
            }
        }
        tx *= rMax * forceFactor
        ty *= rMax * forceFactor
        p.vx *= frictionFactor
        p.vy *= frictionFactor
        p.vx += tx * dt
        p.vy += ty * dt
        
        if (new Date().getTime() - startTime >= Math.min(1000/60, 1000*delta)) {
            particlei = currenti
            stopFrame = true
            return
        }
        currenti++
        
        // if (p.x < minx) {p.x = minx}
        // if (p.x > maxx) {p.x = maxx}
        // if (p.y < miny) {p.y = miny}
        // if (p.y > maxy) {p.y = maxy}
    }

    particlei = 0

    for (let p of particles) {
        p.lx = p.x
        p.ly = p.y

        p.x += p.vx*dt
        p.y += p.vy*dt

        p.vx -= p.x*dt / spawnRange
        p.vy -= p.y*dt / spawnRange

        if (p.x < minx) minx = p.x
        if (p.x > maxx) maxx = p.x
        if (p.y < miny) miny = p.y
        if (p.y > maxy) maxy = p.y

        // if (p.x < minx) {minx = p.x; p.vx *= -1}
        // if (p.x > maxx) {maxx = p.x; p.vx *= -1}
        // if (p.y < miny) {miny = p.y; p.vy *= -1}
        // if (p.y > maxy) {maxy = p.y; p.vy *= -1}
    }

    quadtree = new Quadtree(minx + (maxx-minx)/2, miny + (maxy-miny)/2, maxx-minx, maxy-miny)

    for (let p of particles) {
        quadtree.insert(p)
    }
}

var accumulator = 0
var tDelta = 1/20
var realTDelta = 1/20
var particlei = 0
var startTime = 0
var stopFrame = false
var ticked = false

function update(timestamp) {
    requestAnimationFrame(update)

    utils.getDelta(timestamp)
    ui.resizeCanvas()
    ui.getSu()
    input.setGlobals()

    fps++

    ui.rect(canvas.width/2, canvas.height/2, canvas.width, canvas.height, [0, 0, 0, 1])

    if (keys["Minus"]) {
        camera.zoom *= 0.99
    }
    if (keys["Equal"]) {
        camera.zoom *= 1.01
    }

    if (keys["KeyW"]) {
        camera.y -= 500*delta / camera.zoom
    }
    if (keys["KeyS"]) {
        camera.y += 500*delta / camera.zoom
    }

    if (keys["KeyA"]) {
        camera.x -= 500*delta / camera.zoom
    }
    if (keys["KeyD"]) {
        camera.x += 500*delta / camera.zoom
    }

    if (jKeys["ArrowRight"]) {
        targetTicks = ticks+100
    }

    if (jKeys["KeyT"]) {
        timewarp = !timewarp
        if (!timewarp) {
            tps = 0
            tps2 = 20
        }
    }
    if (jKeys["KeyZ"]) {
        debug = !debug
    }
    if (jKeys["KeyX"]) {
        debug2 = !debug2
    }
    if (jKeys["KeyC"]) {
        debug3 = !debug3
    }
    if (jKeys["KeyQ"]) {
        useQuadtree = !useQuadtree
    }

    accumulator += delta
    startTime = new Date().getTime()
    stopFrame = false
    ticked = true
    while ((accumulator > tDelta || timewarp || ticks < targetTicks)) {
        tick()
        ticked = true
        if (stopFrame) {break} else {
            ticks += 1
            tps += 1
            while (accumulator > tDelta) accumulator -= tDelta
        }
    }
    while (accumulator > tDelta && !stopFrame) accumulator -= tDelta
    if (timewarp) {
        accumulator = 0
    }

    startTime = new Date().getTime()
    quadtree.draw()
    drawTime = new Date().getTime() - startTime

    ui.text(5*su, 35/2*su, 35*su, "FPS: "+fps2)
    ui.text(5*su, (35/2+35)*su, 35*su, "TPS: "+tps2)

    input.updateInput()
}

setInterval(() => {
    console.log(fps, tps)
    realTDelta = 1/tps
    fps2 = fps
    tps2 = tps
    fps = 0
    tps = 0
}, 1000)

requestAnimationFrame(update)