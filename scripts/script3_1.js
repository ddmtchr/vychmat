const outputSolution = document.querySelector('#out-solution')
const methodInput = document.querySelector('#method')
const leftBoundInput = document.querySelector('#left-bound')
const rightBoundInput = document.querySelector('#right-bound')
const precisionInput = document.querySelector('#precision')
const fragmentationInput = document.querySelector('#fragmentation')

const functions = [f1, f2, f3, f4]
const methods = [leftRectanglesMethod, centralRectanglesMethod, rightRectanglesMethod,
    trapezoidMethod, simpsonMethod]

function calculate() {
    outputSolution.innerText = ''
    const equationIndex = parseInt(document.querySelector('input[name="equation"]:checked').value) - 1
    const leftBound = parseFloat(leftBoundInput.value)
    const rightBound = parseFloat(rightBoundInput.value)
    const precision = parseFloat(precisionInput.value)
    const method = parseInt(methodInput.value)
    let fragmentation = parseInt(fragmentationInput.value)
    if (isNaN(leftBound) || isNaN(rightBound) || isNaN(precision) || isNaN(fragmentation)) {
        outputSolution.innerText += 'Не введены или введены неверно границы и/или точность и разбиение'
        return
    }
    if (fragmentation < 4) {
        outputSolution.innerText += 'Минимальное разбиение - 4'
        return
    }

    let prevSolution, solution
    const error = getError(method)

    prevSolution = methods[method - 1](functions[equationIndex], leftBound, rightBound, fragmentation)
    fragmentation = fragmentation * 2;
    solution = methods[method - 1](functions[equationIndex], leftBound, rightBound, fragmentation)

    while (runge(error, prevSolution, solution) >= precision) {
        prevSolution = solution
        fragmentation = fragmentation * 2;
        solution = methods[method - 1](functions[equationIndex], leftBound, rightBound, fragmentation)
    }

    showSolution(solution, fragmentation)
}

function leftRectanglesMethod(f, a, b, frag) {
    const h = (b - a) / frag
    let s = 0
    for (let i = 1; i <= frag; i++) {
        s += f(a + h * (i - 1))
    }
    s = s * h
    return s
}

function centralRectanglesMethod(f, a, b, frag) {
    const h = (b - a) / frag
    let s = 0
    for (let i = 1; i <= frag; i++) {
        s += f(a + h * (i - 0.5))
    }
    s = s * h
    return s
}

function rightRectanglesMethod(f, a, b, frag) {
    const h = (b - a) / frag
    let s = 0
    for (let i = 1; i <= frag; i++) {
        s += f(a + h * i)
    }
    s = s * h
    return s
}

function trapezoidMethod(f, a, b, frag) {
    const h = (b - a) / frag
    let s = 0
    for (let i = 1; i < frag; i++) {
        s += f(a + h * i)
    }
    s = (s * 2 + f(a) + f(b)) * h / 2
    return s
}

function simpsonMethod(f, a, b, frag) {
    const h = (b - a) / frag
    let s = 0
    for (let i = 1; i < frag; i++) {
        if (i % 2 !== 0) s += 4 * f(a + h * i)
        else s += 2 * f(a + h * i)
    }
    s = (s + f(a) + f(b)) * h / 3
    return s
}

function getError(method) {
    switch (method) {
        case 2:
        case 4:
            return 2
        case 5:
            return 4
        case 1:
        case 3:
        default:
            return 1
    }
}

function runge(error, i0, i1) {
    const divisor = Math.pow(2, error) - 1
    return Math.abs(i1 - i0) / divisor
}

function f1(x) {
    return Math.pow(x, 3) - 3 * x * x + 18 * x - 52
}

function f2(x) {
    return Math.cbrt(Math.pow(x, 4) + 1)
}

function f3(x) {
    return Math.exp(-Math.pow(x, 2) / 2) / Math.sqrt(2 * Math.PI)
}

function f4(x) {
    return Math.cos(x * x)
}

function showSolution(solution, frag) {
    outputSolution.innerText += `Решение: ${solution} 
    Итоговое разбиение: ${frag}`
}