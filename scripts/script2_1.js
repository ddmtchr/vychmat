const outputSolution = document.querySelector('#out-solution')
const methodInput = document.querySelector('#method')
const leftBoundInput = document.querySelector('#left-bound')
const rightBoundInput = document.querySelector('#right-bound')
const precisionInput = document.querySelector('#precision')
const iterationsInput = document.querySelector('#iterations')
const fileInput = document.querySelector('#file-input')
const iterationsContainer = document.querySelector('#iterations-container')
const downloadButton = document.querySelector('#download-button')
const radioLabels = document.getElementsByName('equation')

const functions = [f1, f2, f3, f4]
const latexStrings = [
    'x^3-3x^2-13x+15',
    'x-\\cos{4x}',
    'x^{5}-x^{4}+0.39x^{3}-24.58x^{2}+31.23x+15.5',
    '\\ln{(x^2+1)}-5e^{\\frac{1}{2}\\cos{x}}']

const calculatorDiv = document.getElementById('calculator');
const calculator = Desmos.GraphingCalculator(calculatorDiv, {
    expressions: false,
    settingsMenu: false,
    zoomButtons: false,
    lockViewport: true
})

methodInput.addEventListener('change', function () {
    iterationsContainer.style.display = this.value === '3' ? 'flex' : 'none'
})

iterationsInput.addEventListener('input', function () {
    iterationsInput.value = Math.round(iterationsInput.value)
    iterationsInput.value = iterationsInput.value < 1 ? 1 : iterationsInput.value
})

fileInput.addEventListener('change', function () {
    const file = fileInput.files[0]
    const reader = new FileReader()
    reader.onload = function (e) {
        const content = e.target.result
        if (!parseFile(content)) {
            outputSolution.innerText = 'Неверный формат файла: 4 числа (начало и конец отрезка (Н < К), точность, число итераций)'
        }
    }
    reader.onerror = function (e) {
        console.error('Ошибка чтения файла', e.target.error)
    }
    if (file) {
        reader.readAsText(file)
    }
})

downloadButton.addEventListener('click', function () {
    let text = outputSolution.innerText
    let filename = "out.txt"
    let element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text))
    element.setAttribute("download", filename)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
})

for (let radio of radioLabels) {
    radio.addEventListener('click', function() {
        const equationIndex = parseInt(radio.value) - 1;
        calculator.setExpression({id: 'y', latex: latexStrings[equationIndex]})
        calculator.setMathBounds({left: -10, right: 10, top: 6, bottom: -6})
        calculatorDiv.hidden = false
    })
}

function calculate() {
    outputSolution.innerText = ''
    downloadButton.hidden = true
    const equationIndex = parseInt(document.querySelector('input[name="equation"]:checked').value) - 1
    const leftBound = parseFloat(leftBoundInput.value)
    const rightBound = parseFloat(rightBoundInput.value)
    const precision = parseFloat(precisionInput.value)
    const method = parseInt(methodInput.value)
    if (isNaN(leftBound) || isNaN(rightBound) || isNaN(precision) || rightBound <= leftBound) {
        outputSolution.innerText += 'Не введены или введены неверно границы и/или точность'
        return
    }

    let [min, max] = [findMinOnInterval(functions[equationIndex], leftBound, rightBound, 0.01),
        findMaxOnInterval(functions[equationIndex], leftBound, rightBound, 0.01)]

    calculator.setExpression({id: 'y', latex: latexStrings[equationIndex]})
    calculator.setMathBounds({left: leftBound - 0.5, right: rightBound + 0.5, top: max + 1, bottom: min - 1})
    calculatorDiv.hidden = false

    if (!rootExistsAndOnlyOne(functions[equationIndex], leftBound, rightBound)) {
        outputSolution.innerText += 'На указанном отрезке 0 или несколько корней'
        return
    }

    let solution, iters
    switch (method) {
        case 1:
            [solution, iters] = halfDivision(functions[equationIndex], leftBound, rightBound, precision)
            showSolution(solution, equationIndex, iters)
            downloadButton.hidden = false
            break
        case 2:
            if (!newtonConditions(functions[equationIndex], leftBound, rightBound)) {
                outputSolution.innerText += 'Условия метода Ньютона не выполняются, попробуйте другой'
                return
            }
            [solution, iters] = newtonMethod(functions[equationIndex], leftBound, rightBound, precision)
            showSolution(solution, equationIndex, iters)
            downloadButton.hidden = false
            break
        case 3:
            [solution, iters] = simpleIteration(functions[equationIndex], leftBound, rightBound, precision)
            showSolution(solution, equationIndex, iters)
            downloadButton.hidden = false
            break
        default:
            break
    }
}

function halfDivision(f, a, b, precision) {
    let currentIter = 0
    if (f(a) === 0) return [a, currentIter]
    if (f(b) === 0) return [b, currentIter]
    let x = (a + b) / 2
    while (Math.abs(f(x)) > precision || Math.abs(b - a) > precision) {
        if (f(a) * f(x) < 0) b = x
        else if (f(b) * f(x) < 0) a = x
        else break
        x = (a + b) / 2
        currentIter++
    }
    return [x, currentIter]
}

function newtonMethod(f, a, b, precision) {
    let x = getNewtonApproximation(f, a, b)
    let prev = x + 10 * precision
    let currentIter = 0
    while (Math.abs(prev - x) > precision || Math.abs(f(x)) > precision) {
        prev = x
        x = prev - f(prev) / derivative(f, prev)
        currentIter++
    }
    return [x, currentIter]
}

function newtonConditions(f, a, b) {
    return derivativesSignIsConstant(f, a, b) && derivative(f, (a + b) / 2) !== 0
}

function getNewtonApproximation(f, a, b) {
    if (f(a) * secondDerivative(f, a) > 0) return a
    if (f(b) * secondDerivative(f, b) > 0) return b
    return (a + b) / 2
}

function simpleIteration(f, a, b, precision) {
    const lambda = -1 / Math.max(derivative(f, a), derivative(f, b))
    let q = maxPhiDerivative(a, b, lambda, f)
    let x = (a + b) / 2 // getNewtonApproximation(f, a, b)
    let prev = x + 10 * precision
    let currentIter = 0
    const maxIter = parseInt(iterationsInput.value)
    if (q < 1) {
        while (Math.abs(prev - x) > precision || Math.abs(f(x)) > precision) {
            prev = x
            x = Phi(prev, lambda, f)
            currentIter++
        }
    } else {
        outputSolution.innerText += 'Возможно, решение этим методом не сойдется\n'
        while ((Math.abs(prev - x) > precision || Math.abs(f(x)) > precision) && currentIter < maxIter) {
            prev = x
            x = Phi(prev, lambda, f)
            currentIter++
        }
    }

    return [x, currentIter]
}

function maxPhiDerivative(a, b, lambda, f) {
    let m = 0
    const step = 0.001
    let x = a + step
    while (x < b) {
        m = Math.max(m, Math.abs(PhiDerivative(x, lambda, f)))
        x += step
    }
    return m
}

function f1(x) {
    return (x - 5) * (x + 3) * (x - 1)
}

function f2(x) {
    return x - Math.cos(4 * x)
}

function f3(x) {
    return Math.pow(x, 5) - Math.pow(x, 4) + 0.39 * Math.pow(x, 3) - 24.58 * Math.pow(x, 2) + 31.23 * x + 15.5
}

function f4(x) {
    return Math.log(x * x + 1) - 5 * Math.exp(1 / 2 * Math.cos(x))
}

function rootExistsAndOnlyOne(f, a, b) {
    if (f(a) * f(b) > 0) return false
    const step = 0.001
    let current = f(a)
    let x = a + step
    let count = 0
    if (f(a) === 0) count++
    if (f(b) === 0) count++
    while (x < b) {
        if (current * f(x) < 0) count++
        if (count > 1) return false
        current = f(x)
        x += step
    }
    return true
}

function derivativesSignIsConstant(f, a, b) {
    const step = 0.001
    let x = a + step
    let current1 = derivative(f, a)
    let current2 = secondDerivative(f, a)
    while (x < b) {
        if (current1 * derivative(f, x) < 0) return false
        if (current2 * secondDerivative(f, x) < 0) return false
        current1 = derivative(f, x)
        current2 = secondDerivative(f, x)
        x += step
    }
    return true
}

function parseFile(text) {
    const parsed = text.trim().split(/\s+/)
    for (let i = 0; i < parsed.length; i++) {
        if (isNaN(parseFloat(parsed[i]))) return false
    }
    if (parsed.length !== 4) return false
    if (parseFloat(parsed[0]) >= parseFloat(parsed[1])) return false
    leftBoundInput.value = parsed[0]
    rightBoundInput.value = parsed[1]
    precisionInput.value = parsed[2]
    iterationsInput.value = parsed[3]
    return true
}

function showSolution(solution, index, iters) {
    outputSolution.innerText += `Решение: ${solution} 
    f(${solution})=${functions[index](solution)} 
    Итерации: ${iters}`
}
