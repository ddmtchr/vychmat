const outputSolution = document.querySelector('#out-solution')
const xApprInput = document.querySelector('#x-appr')
const yApprInput = document.querySelector('#y-appr')
const radioLabels = document.getElementsByName('equation')

const precision = 0.01
const functions = [[f1, f2], [f3, f4]]
const latexStrings = [
    ['x+xy^3-9=0',
        'xy+xy^2-6=0'],
    ['\\sin{(x-1)}-y-2=0',
        '3x-\\cos{y}-2=0']]

const calculatorDiv = document.getElementById('calculator');
const calculator = Desmos.GraphingCalculator(calculatorDiv, {
    expressions: false,
    settingsMenu: false,
    zoomButtons: false,
    lockViewport: true
})

for (let radio of radioLabels) {
    radio.addEventListener('click', function() {
        const equationIndex = parseInt(radio.value) - 1;
        calculator.setExpressions([{id: 'x', latex: latexStrings[equationIndex][0]},
            {id: 'y', latex: latexStrings[equationIndex][1]}])
        calculator.setMathBounds({left: -10, right: 10, top: 6, bottom: -6})
        calculatorDiv.hidden = false
    })
}

function calculate() {
    outputSolution.innerText = ''
    const equationIndex = parseInt(document.querySelector('input[name="equation"]:checked').value) - 1
    const xAppr = parseFloat(xApprInput.value)
    const yAppr = parseFloat(yApprInput.value)
    if (isNaN(xAppr) || isNaN(yAppr)) {
        outputSolution.innerText += 'Не введены или введены неверно приближения'
        return
    }

    calculator.setExpressions([{id: 'x', latex: latexStrings[equationIndex][0]},
        {id: 'y', latex: latexStrings[equationIndex][1]}])
    calculator.setMathBounds({left: -9, right: 9, top: 6, bottom: -6})
    calculatorDiv.hidden = false

    let [solution, deltas, iters] = newtonMethod(functions[equationIndex], xAppr, yAppr)

    showSolution(iters, equationIndex, solution, deltas)
}

function newtonMethod(funcs, x0, y0) {
    let x
    let prev = [x0, y0]
    let delta = precision
    let deltas = []
    let currentIter = 0

    while (delta >= precision && currentIter < 10000) {
        let [prevX, prevY] = prev
        let J = [[derivativeX(funcs[0], prevX, prevY), derivativeY(funcs[0], prevX, prevY)],
            [derivativeX(funcs[1], prevX, prevY), derivativeY(funcs[1], prevX, prevY)]]
        let inverseJ = inverse2Matrix(J)
        let F = [funcs[0](prevX, prevY), funcs[1](prevX, prevY)]
        x = subVectors(prev, matrixByVector(inverseJ, F))

        deltas = [Math.abs(x[0] - prevX), Math.abs(x[1] - prevY)]
        delta = Math.max(...deltas)
        prev = x.slice()
        currentIter++
    }
    return [x, deltas, currentIter]
}

function f1(x, y) {
    return x + x * Math.pow(y, 3) - 9
}

function f2(x, y) {
    return x * y + x * y * y - 6
}

function f3(x, y) {
    return Math.sin(x - 1) - y - 2
}

function f4(x, y) {
    return 3 * x - Math.cos(y) - 2
}

function showSolution(currentIter, index, x, deltas) {
    let solutionText = currentIter < 10000 ? `Решение (итераций: ${currentIter}):` : `Выход за максимальное число итераций. Не сошлось :(\n Неверное решение (итераций: ${currentIter}):`
    let solutionLabel = document.createElement('p')
    let errorsLabel = document.createElement('p')
    solutionLabel.innerText = solutionText
    errorsLabel.innerText = 'Погрешности:'
    outputSolution.appendChild(solutionLabel)
    outputSolution.appendChild(vectorToHTML(x))
    outputSolution.appendChild(errorsLabel)
    outputSolution.appendChild(vectorToHTML(deltas))
    outputSolution.innerText += `
    
    F1=${functions[index][0](x[0], x[1])}
    F2=${functions[index][1](x[0], x[1])}`
}
