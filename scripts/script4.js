const pointsNumberInput = document.querySelector('#pointsNumber')
const matrix = document.querySelector('#matrix')
const matrixInput = document.querySelector('#matrix-input')
const fileInput = document.querySelector('#file-input')
const solution = document.querySelector('#out-solution')
const downloadButton = document.querySelector('#download-button')
const approximationNames = ['линейная', 'квадратичная', 'кубическая', null, null, null]
const approximationColors = ['красный', 'синий', 'зеленый', null, null, null]
const latexStrings = Array(6).fill(null)
let fileText = ''

pointsNumberInput.addEventListener('input', toggleMatrix)

const calculatorDiv = document.getElementById('calculator');
const calculator = Desmos.GraphingCalculator(calculatorDiv, {
    // expressions: true,
    // settingsMenu: true,
    zoomButtons: true,
    lockViewport: false,
    expressions: false,
    settingsMenu: false
    // zoomButtons: false,
    // lockViewport: true
})

fileInput.addEventListener('change', function () {
    const file = fileInput.files[0]
    const reader = new FileReader()
    reader.onload = function (e) {
        const content = e.target.result
        clearOutput()
        if (!parseFile(content)) {
            solution.innerText = 'Неверный формат файла: количество точек, координаты точек x y через пробел'
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
    let filename = "out.txt"
    let element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(fileText))
    element.setAttribute("download", filename)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
})

function toggleMatrix() {
    pointsNumberInput.value = Math.round(pointsNumberInput.value)
    if (parseFloat(pointsNumberInput.value) !== 0 && pointsNumberInput.value !== '') {
        matrix.style.display = 'block'

        matrixInput.innerHTML = '<tr><td>X</td><td>Y</td></tr>'
        const pointsNumberValue = parseInt(pointsNumberInput.value)
        const pointsNumber = pointsNumberValue > 12 ? 12 : (pointsNumberValue < 7 ? 7 : pointsNumberValue)
        for (let i = 0; i < pointsNumber; i++) {
            let row = document.createElement('tr')
            for (let j = 0; j < 2; j++) {
                let cell = createCellWithInput()
                row.appendChild(cell)
            }
            matrixInput.appendChild(row)
        }


    } else if (matrix.style.display === 'block' && (parseFloat(pointsNumberInput.value) === 0 || pointsNumberInput.value === '')) {
        matrix.style.display = 'none'
    }
}

function clearInput() {
    let matrixInputs = document.querySelectorAll('#matrix-input input')
    let matrixInputsList = [...matrixInputs]
    for (let i = 0; i < matrixInputsList.length; i++) {
        matrixInputsList[i].value = ''
    }
}

function clearOutput() {
    solution.innerHTML = ''
    calculator.setBlank()
}

function calculate() {
    downloadButton.hidden = false
    clearOutput()
    const pointsNumberValue = parseInt(pointsNumberInput.value)
    if (pointsNumberValue < 7 || pointsNumberValue > 12) {
        setOriginal('Нужно от 7 до 12 точек')
        return
    }
    let [pointsX, pointsY] = parseMatrix();
    console.log(pointsX, pointsY)
    if (!validateFullMatrix(pointsX) || !validateFullMatrix(pointsY)) {
        setOriginal('Точки заполнены не полностью')
        return
    }

    const [xmin, xmax] = [Math.min(...pointsX), Math.max(...pointsX)]
    const ymin = Math.min(...pointsY)

    const linearCoefs = linearApproximation(pointsX, pointsY)
    const quadraticCoefs = quadraticApproximation(pointsX, pointsY)
    const cubicCoefs = cubicApproximation(pointsX, pointsY)
    let expCoefs = null, logCoefs = null, powerCoefs = null

    latexStrings[0] = `${linearCoefs[0]}x+(${linearCoefs[1]})`
    latexStrings[1] = `${quadraticCoefs[0]}x^2+(${quadraticCoefs[1]})x+(${quadraticCoefs[2]})`
    latexStrings[2] = `${cubicCoefs[0]}x^3+(${cubicCoefs[1]})x^2+(${cubicCoefs[2]})x+(${cubicCoefs[3]})`
    // ,{id: '7', latex: '\\ln(x)+1', color: '#ffff00'}

    calculator.setMathBounds({
        left: xmin - 1,
        right: xmax + 1,
        top: 0.8 * (xmax + xmin + 2),
        bottom: -0.2 * (xmax + xmin + 2)
    })
    calculator.setExpressions([{id: '0', latex: latexStrings[0], color: Desmos.Colors.RED},
        {
            id: '1',
            latex: latexStrings[1],
            color: Desmos.Colors.BLUE
        },
        {
            id: '2',
            latex: latexStrings[2],
            color: Desmos.Colors.GREEN
        }])

    if (xmin > 0 && ymin > 0) powerCoefs = addApproximation('power', pointsX, pointsY)
    if (ymin > 0) expCoefs = addApproximation('exponential', pointsX, pointsY)
    if (xmin > 0) logCoefs = addApproximation('logarithmic', pointsX, pointsY)

    calculatorDiv.hidden = false;

    let approximatedY = [[], [], [], [], [], []]

    let averageYApproximated = Array(6).fill(null)
    for (let i = 0; i < pointsNumberValue; i++) {
        approximatedY[0].push(linear(linearCoefs[0], linearCoefs[1], pointsX[i]))
        approximatedY[1].push(quadratic(quadraticCoefs[0], quadraticCoefs[1], quadraticCoefs[2], pointsX[i]))
        approximatedY[2].push(cubic(cubicCoefs[0], cubicCoefs[1], cubicCoefs[2], cubicCoefs[3], pointsX[i]))
        if (expCoefs !== null) approximatedY[3].push(exponential(expCoefs[0], expCoefs[1], pointsX[i]))
        if (logCoefs !== null) approximatedY[4].push(logarithmic(logCoefs[0], logCoefs[1], pointsX[i]))
        if (powerCoefs !== null) approximatedY[5].push(power(powerCoefs[0], powerCoefs[1], pointsX[i]))
    }
    for (let i = 0; i < 6; i++) {
        if (approximatedY[i].length !== 0) {
            averageYApproximated[i] = [...approximatedY[i]].reduce((a, b) => a + b, 0) / pointsNumberValue
        }
    }

    const functionsLabel = document.createElement('div')
    functionsLabel.innerHTML += `<p>Аппроксимирующие функции:</p>
    <p>\\(${linearCoefs[0]}x+(${linearCoefs[1]})\\)</p>
    <p>\\(${quadraticCoefs[0]}x^2+(${quadraticCoefs[1]})x+(${quadraticCoefs[2]})\\)</p>
    <p>\\(${cubicCoefs[0]}x^3+(${cubicCoefs[1]})x^2+(${cubicCoefs[2]})x+(${cubicCoefs[3]})\\)</p>
    `
    if (expCoefs !== null) functionsLabel.innerHTML += `<p>\\(${expCoefs[0]}*e^{${expCoefs[1]}x}\\)</p>`
    if (logCoefs !== null) functionsLabel.innerHTML += `<p>\\(${logCoefs[0]}\\ln(x)+(${logCoefs[1]})\\)</p>`
    if (powerCoefs !== null) functionsLabel.innerHTML += `<p>\\(${powerCoefs[0]}x^{${powerCoefs[1]}}\\)</p>`
    solution.appendChild(functionsLabel)

    MathJax.typeset()

    let deviations = Array(6).fill([]), quadDeviations = Array(6).fill(null)
    let standardDeviations = Array(6).fill(null), determinations = Array(6).fill(null)

    for (let i = 0; i < 6; i++) {
        if (averageYApproximated[i] !== null) {
            let quadDeviation = 0
            let deviationFromAverage = 0
            let determination = 0
            for (let j = 0; j < pointsNumberValue; j++) {
                deviations[i].push(approximatedY[i][j] - pointsY[j])
                quadDeviation += Math.pow(approximatedY[i][j] - pointsY[j], 2)
                deviationFromAverage += Math.pow(averageYApproximated[i] - pointsY[j], 2)
            }
            quadDeviations[i] = quadDeviation
            determination = 1 - quadDeviation / deviationFromAverage
            determinations[i] = determination
            standardDeviations[i] = Math.sqrt(quadDeviation / pointsNumberValue)
        }
    }

    solution.appendChild(createStatTable(quadDeviations, standardDeviations, determinations))

    const minDeviation = Math.min(...standardDeviations.filter((x) => x !== null))
    const bestApproximationIndex = standardDeviations.findIndex(x => x === minDeviation)
    const bestApproximationLabel = document.createElement('p')
    bestApproximationLabel.innerText += `Лучшая аппроксимация - ${approximationNames[bestApproximationIndex]} (${approximationColors[bestApproximationIndex]} график)
    `
    solution.appendChild(bestApproximationLabel)

    const averageX = [...pointsX].reduce((a, b) => a + b, 0) / pointsX.length
    const averageY = [...pointsY].reduce((a, b) => a + b, 0) / pointsY.length
    let sumXY = 0, sumXX = 0, sumYY = 0
    for (let i = 0; i < pointsNumberValue; i++) {
        sumXY += (pointsX[i] - averageX) * (pointsY[i] - averageY)
        sumXX += Math.pow(pointsX[i] - averageX, 2)
        sumYY += Math.pow(pointsY[i] - averageY, 2)
    }
    const r = sumXY / Math.sqrt(sumXX * sumYY)
    const pearsonCoefLabel = document.createElement('p')
    pearsonCoefLabel.innerText += `Коэффициент корреляции Пирсона для линейной зависимости ${r}
    `
    solution.appendChild(pearsonCoefLabel)
    fileText = createFileText(linearCoefs, quadraticCoefs, cubicCoefs, expCoefs, logCoefs, powerCoefs,
        quadDeviations, standardDeviations, determinations, bestApproximationIndex, r)
    downloadButton.hidden = false

}

function linearApproximation(X, Y) {
    let SX = 0, SY = 0, SXX = 0, SXY = 0
    const n = X.length
    for (let i = 0; i < n; i++) {
        SX += X[i]
        SXX += X[i] * X[i]
        SY += Y[i]
        SXY += X[i] * Y[i]
    }
    const a = (SXY * n - SX * SY) / (SXX * n - SX * SX)
    const b = (SXX * SY - SX * SXY) / (SXX * n - SX * SX)
    console.log(`linear ${a}x+${b}`)
    return [a, b]
}

function quadraticApproximation(X, Y) {
    let SX = 0, SY = 0, SXX = 0, SXY = 0, S3X = 0, S4X = 0, SX2Y = 0
    const n = X.length
    for (let i = 0; i < n; i++) {
        SX += X[i]
        SXX += X[i] * X[i]
        SY += Y[i]
        SXY += X[i] * Y[i]
        S3X += Math.pow(X[i], 3)
        S4X += Math.pow(X[i], 4)
        SX2Y += X[i] * X[i] * Y[i]
    }
    const matrix = [[n, SX, SXX], [SX, SXX, S3X], [SXX, S3X, S4X]]
    const bVector = [SY, SXY, SX2Y]
    const coefs = math.lusolve(matrix, bVector)
    console.log(`quad ${coefs[2][0]}x^2 + ${coefs[1][0]}x + ${coefs[0][0]}`)
    return [coefs[2][0], coefs[1][0], coefs[0][0]]
}

function cubicApproximation(X, Y) {
    let SX = 0, SY = 0, SXX = 0, SXY = 0, S3X = 0,
        S4X = 0, S5X = 0, S6X = 0, SX2Y = 0, SX3Y = 0
    const n = X.length
    for (let i = 0; i < n; i++) {
        SX += X[i]
        SXX += X[i] * X[i]
        SY += Y[i]
        SXY += X[i] * Y[i]
        S3X += Math.pow(X[i], 3)
        S4X += Math.pow(X[i], 4)
        S5X += Math.pow(X[i], 5)
        S6X += Math.pow(X[i], 6)
        SX2Y += X[i] * X[i] * Y[i]
        SX3Y += X[i] * X[i] * X[i] * Y[i]
    }
    const matrix = [[n, SX, SXX, S3X], [SX, SXX, S3X, S4X], [SXX, S3X, S4X, S5X], [S3X, S4X, S5X, S6X]]
    const bVector = [SY, SXY, SX2Y, SX3Y]
    const coefs = math.lusolve(matrix, bVector)
    console.log(`cube ${coefs[3][0]}x^3 + ${coefs[2][0]}x^2 + ${coefs[1][0]}x + ${coefs[0][0]}`)
    return [coefs[3][0], coefs[2][0], coefs[1][0], coefs[0][0]]
}

function exponentialApproximation(X, Y) {
    let SX = 0, SY = 0, SXX = 0, SXY = 0
    const n = X.length
    for (let i = 0; i < n; i++) {
        SX += X[i]
        SXX += X[i] * X[i]
        SY += Math.log(Y[i])
        SXY += X[i] * Math.log(Y[i])
    }
    const a = (SXX * SY - SX * SXY) / (SXX * n - SX * SX)
    const b = (SXY * n - SX * SY) / (SXX * n - SX * SX)
    console.log(`exp ${Math.exp(a)}e^{${b}x}`)
    return [Math.exp(a), b]
}

function logarithmicApproximation(X, Y) {
    let SX = 0, SY = 0, SXX = 0, SXY = 0
    const n = X.length
    for (let i = 0; i < n; i++) {
        SX += Math.log(X[i])
        SXX += Math.log(X[i]) * Math.log(X[i])
        SY += Y[i]
        SXY += Math.log(X[i]) * Y[i]
    }
    const a = (SXY * n - SX * SY) / (SXX * n - SX * SX)
    const b = (SXX * SY - SX * SXY) / (SXX * n - SX * SX)
    console.log(`log ${a}lnx+${b}`)
    return [a, b]
}

function powerApproximation(X, Y) {
    let SX = 0, SY = 0, SXX = 0, SXY = 0
    const n = X.length
    for (let i = 0; i < n; i++) {
        SX += Math.log(X[i])
        SXX += Math.log(X[i]) * Math.log(X[i])
        SY += Math.log(Y[i])
        SXY += Math.log(X[i]) * Math.log(Y[i])
    }
    const a = (SXX * SY - SX * SXY) / (SXX * n - SX * SX)
    const b = (SXY * n - SX * SY) / (SXX * n - SX * SX)
    console.log(`power ${Math.exp(a)}x^{${b}}`)
    return [Math.exp(a), b]
}

function linear(a, b, x) {
    return a * x + b;
}

function quadratic(a0, a1, a2, x) {
    return a0 * x * x + a1 * x + a2;
}

function cubic(a0, a1, a2, a3, x) {
    return a0 * x * x * x + a1 * x * x + a2 * x + a3;
}

function exponential(a, b, x) {
    return a * Math.exp(b * x);
}

function logarithmic(a, b, x) {
    return a * Math.log(x) + b;
}

function power(a, b, x) {
    return a * Math.pow(x, b);
}

function validateFullMatrix(m) {
    return !m.includes(NaN)
}

function addApproximation(name, pointsX, pointsY) {
    let coefs = null
    if (name === 'exponential') {
        coefs = exponentialApproximation(pointsX, pointsY)
        latexStrings[3] = `${coefs[0]}*e^{${coefs[1]}x}`
        calculator.setExpression({id: '3', latex: latexStrings[3], color: Desmos.Colors.PURPLE})
        approximationNames[3] = 'экспоненциальная'
        approximationColors[3] = 'фиолетовый'
    }
    if (name === 'logarithmic') {
        coefs = logarithmicApproximation(pointsX, pointsY)
        latexStrings[4] = `${coefs[0]}\\ln(x)+${coefs[1]}`
        calculator.setExpression({id: '4', latex: latexStrings[4], color: Desmos.Colors.ORANGE})
        approximationNames[4] = 'логарифмическая'
        approximationColors[4] = 'оранжевый'
    }
    if (name === "power") {
        coefs = powerApproximation(pointsX, pointsY)
        latexStrings[5] = `${coefs[0]}x^{${coefs[1]}}`
        calculator.setExpression({id: '5', latex: latexStrings[5], color: Desmos.Colors.BLACK})
        approximationNames[5] = 'степенная'
        approximationColors[5] = 'черный'
    }
    return coefs
}

function parseFile(text) {
    const parsed = text.trim().split(/\s+/)
    for (let i = 0; i < parsed.length; i++) {
        if (isNaN(parseFloat(parsed[i]))) return false
    }
    const num = parseFloat(parsed[0])
    if (parsed.length !== 2 * num + 1) return false
    pointsNumberInput.value = num

    toggleMatrix()

    const offset = 1
    let matrixInputs = document.querySelectorAll('#matrix-input input')
    let matrixInputsList = [...matrixInputs]
    for (let i = 0; i < num * 2; i++) {
        matrixInputsList[i].value = parseFloat(parsed[i + offset])
    }
    console.log('parsed')
    return true
}

function parseMatrix() {
    const pointsNumber = parseInt(pointsNumberInput.value)
    let pointsX = [], pointsY = []
    let inputs = document.querySelectorAll('#matrix-input input')
    let inputsList = [...inputs]
    for (let i = 0; i < pointsNumber; i++) {
        pointsX.push(parseFloat(inputsList[i * 2].value))
        pointsY.push(parseFloat(inputsList[i * 2 + 1].value))
    }
    return [pointsX, pointsY]
}

function createCellWithInput() {
    let cell = document.createElement('td')
    let input = document.createElement('input')
    input.type = 'number'
    input.addEventListener('focus', () => input.select())
    cell.appendChild(input)
    return cell
}

function setOriginal(message) {
    let label = document.createElement('p')
    label.innerText = message
    solution.appendChild(label)
}

function createStatTable(S, sko, det) {
    let table = document.createElement('table');

    let headerRow = table.insertRow();
    let headerCell1 = headerRow.insertCell();
    let headerCell2 = headerRow.insertCell();
    let headerCell3 = headerRow.insertCell();
    let headerCell4 = headerRow.insertCell();
    headerCell1.textContent = 'Функция';
    headerCell2.textContent = 'Мера отклонения';
    headerCell3.textContent = 'СКО';
    headerCell4.textContent = 'Достоверность';

    for (let i = 0; i < S.length; i++) {
        if (S[i] !== null) {
            let row = table.insertRow();
            let cell1 = row.insertCell();
            let cell2 = row.insertCell();
            let cell3 = row.insertCell();
            let cell4 = row.insertCell();
            cell1.textContent = approximationNames[i]
            cell2.textContent = S[i];
            cell3.textContent = sko[i];
            cell4.textContent = det[i];
        }
    }
    return table;
}

function createFileText(linearCoefs, quadraticCoefs, cubicCoefs, expCoefs, logCoefs, powerCoefs,
                        S, sko, det, bestIndex, pearson) {
    let text = '';

    text += 'Linear Coefficients: ' + linearCoefs.join(', ') + '\n';
    text += 'Quadratic Coefficients: ' + quadraticCoefs.join(', ') + '\n';
    text += 'Cubic Coefficients: ' + cubicCoefs.join(', ') + '\n';
    if (expCoefs !== null) text += 'Exponential Coefficients: ' + expCoefs.join(', ') + '\n';
    if (logCoefs !== null) text += 'Logarithmic Coefficients: ' + logCoefs.join(', ') + '\n';
    if (powerCoefs !== null) text += 'Power Coefficients: ' + powerCoefs.join(', ') + '\n\n';

    text += 'Table:\n';
    text += 'S: ' + S.join(', ') + '\n';
    text += 'SKO: ' + sko.join(', ') + '\n';
    text += 'Determination: ' + det.join(', ') + '\n\n';

    text += `Лучшая аппроксимация - ${approximationNames[bestIndex]} (${approximationColors[bestIndex]} график)
`
    text += 'Коэффициент Пирсона: ' + pearson + '\n';
    return text;
}
