class PremiumCalculator {
    constructor() {
        this.expression = '';
        this.result = '0';
        this.lastOperator = null;
        this.shouldResetDisplay = false;
        this.memory = 0;
        
        this.expressionElement = document.getElementById('expression');
        this.resultElement = document.getElementById('result');
        
        this.init();
        this.bindEvents();
        this.addKeyboardSupport();
    }

    init() {
        this.updateDisplay();
        this.startAnimations();
    }

    bindEvents() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => this.handleButtonClick(e));
            button.addEventListener('mousedown', (e) => this.addRippleEffect(e));
        });
    }

    addKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            e.preventDefault(); // Prevent default behavior for all calculator keys
            
            const key = e.key;
            
            // Number keys
            if (/[0-9]/.test(key)) {
                this.handleNumber(key);
            }
            // Operator keys
            else if (['+', '-', '*', '/'].includes(key)) {
                this.handleOperator(key);
            }
            // Decimal point
            else if (key === '.') {
                this.handleNumber('.');
            }
            // Equals
            else if (key === 'Enter' || key === '=') {
                this.handleEquals();
            }
            // Clear
            else if (key === 'Escape' || key.toLowerCase() === 'c') {
                this.handleClear();
            }
            // Backspace
            else if (key === 'Backspace') {
                this.handleBackspace();
            }
            // Percent
            else if (key === '%') {
                this.handlePercent();
            }
        });
    }

    handleButtonClick(e) {
        const button = e.target;
        const value = button.dataset.value;
        const action = button.dataset.action;

        // Add haptic feedback (vibration on mobile)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        if (value) {
            if (/[0-9.]/.test(value)) {
                this.handleNumber(value);
            } else {
                this.handleOperator(value);
            }
        } else if (action) {
            switch (action) {
                case 'clear':
                    this.handleClear();
                    break;
                case 'backspace':
                    this.handleBackspace();
                    break;
                case 'equals':
                    this.handleEquals();
                    break;
                case 'percent':
                    this.handlePercent();
                    break;
            }
        }
    }

    addRippleEffect(e) {
        const button = e.target;
        button.classList.add('ripple');
        
        setTimeout(() => {
            button.classList.remove('ripple');
        }, 300);
    }

    handleNumber(num) {
        if (this.shouldResetDisplay) {
            this.result = '';
            this.shouldResetDisplay = false;
        }

        if (num === '.' && this.result.includes('.')) {
            return; // Prevent multiple decimal points
        }

        if (this.result === '0' && num !== '.') {
            this.result = num;
        } else {
            this.result += num;
        }

        this.updateDisplay();
    }

    handleOperator(operator) {
        if (this.expression && !this.shouldResetDisplay) {
            this.handleEquals();
        }

        // Convert display symbols to calculation symbols
        const operatorMap = {
            '×': '*',
            '÷': '/',
            '−': '-',
            '+': '+'
        };

        const calcOperator = operatorMap[operator] || operator;
        
        this.expression = this.result + ' ' + operator + ' ';
        this.lastOperator = calcOperator;
        this.shouldResetDisplay = true;
        this.updateDisplay();
    }

    handleEquals() {
        if (!this.expression || this.shouldResetDisplay) {
            return;
        }

        try {
            const fullExpression = this.expression + this.result;
            
            // Convert display symbols to calculation symbols for evaluation
            const calcExpression = fullExpression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-');

            // Evaluate the expression using safe evaluation
            const result = this.safeEvaluate(calcExpression);
            
            if (result === null) {
                throw new Error('Invalid expression');
            }

            // Format the result
            this.result = this.formatResult(result);
            this.expression = '';
            this.shouldResetDisplay = true;
            
            // Add update animation
            this.resultElement.classList.add('updating');
            setTimeout(() => {
                this.resultElement.classList.remove('updating');
            }, 300);
            
            this.updateDisplay();
        } catch (error) {
            this.showError('Error');
        }
    }

    handleClear() {
        this.expression = '';
        this.result = '0';
        this.shouldResetDisplay = false;
        this.lastOperator = null;
        this.updateDisplay();
        
        // Add clear animation
        this.resultElement.classList.add('updating');
        setTimeout(() => {
            this.resultElement.classList.remove('updating');
        }, 200);
    }

    handleBackspace() {
        if (this.shouldResetDisplay) {
            return;
        }

        if (this.result.length > 1) {
            this.result = this.result.slice(0, -1);
        } else {
            this.result = '0';
        }
        
        this.updateDisplay();
    }

    handlePercent() {
        if (this.result && this.result !== '0') {
            const num = parseFloat(this.result);
            this.result = this.formatResult(num / 100);
            this.updateDisplay();
        }
    }

    safeEvaluate(expression) {
        try {
            // Remove any non-mathematical characters for security
            const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
            
            // Check for valid mathematical expression
            if (!/^[0-9+\-*/.() ]+$/.test(sanitized)) {
                return null;
            }

            // Use Function constructor for safe evaluation (better than eval)
            const result = Function('"use strict"; return (' + sanitized + ')')();
            
            if (!isFinite(result)) {
                return null;
            }
            
            return result;
        } catch (error) {
            return null;
        }
    }

    formatResult(num) {
        if (num === null || num === undefined || !isFinite(num)) {
            return 'Error';
        }

        // Handle very large or very small numbers
        if (Math.abs(num) > 999999999999 || (Math.abs(num) < 0.000001 && num !== 0)) {
            return num.toExponential(6);
        }

        // Format decimal places
        const formatted = parseFloat(num.toFixed(10));
        
        // Convert to string and limit display length
        let result = formatted.toString();
        if (result.length > 12) {
            result = formatted.toPrecision(8);
        }

        return result;
    }

    showError(message) {
        this.result = message;
        this.expression = '';
        this.shouldResetDisplay = true;
        
        this.resultElement.classList.add('error');
        setTimeout(() => {
            this.resultElement.classList.remove('error');
            if (this.result === 'Error') {
                this.handleClear();
            }
        }, 2000);
        
        this.updateDisplay();
    }

    updateDisplay() {
        this.expressionElement.textContent = this.expression;
        this.resultElement.textContent = this.result;
        
        // Auto-scale font size for long numbers
        this.autoScaleDisplay();
    }

    autoScaleDisplay() {
        const maxLength = 12;
        const minFontSize = 24;
        const maxFontSize = 48;
        
        const length = this.result.length;
        let fontSize = maxFontSize;
        
        if (length > maxLength) {
            fontSize = Math.max(minFontSize, maxFontSize - (length - maxLength) * 2);
        }
        
        this.resultElement.style.fontSize = fontSize + 'px';
    }

    startAnimations() {
        // Add entrance animation delay for buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach((button, index) => {
            button.style.animationDelay = (index * 0.05) + 's';
            button.classList.add('btn-entrance');
        });
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new PremiumCalculator();
    
    // Prevent context menu on calculator
    document.querySelector('.calculator').addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Prevent text selection
    document.querySelector('.calculator').addEventListener('selectstart', (e) => {
        e.preventDefault();
    });
    
    // Add touch feedback for mobile
    if ('ontouchstart' in window) {
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('touchstart', (e) => {
                button.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    button.style.transform = '';
                }, 100);
            });
        });
    }
});

// Add simple button entrance animation
const style = document.createElement('style');
style.textContent = `
    .btn-entrance {
        animation: buttonEntrance 0.4s ease-out forwards;
        opacity: 0;
        transform: translateY(10px);
    }
    
    @keyframes buttonEntrance {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// PWA capabilities disabled for this version

// Handle window resize for responsive adjustments
window.addEventListener('resize', () => {
    // Trigger any responsive recalculations if needed
    const calculator = document.querySelector('.calculator');
    if (calculator) {
        calculator.style.transform = 'scale(1)';
    }
});

// Add performance monitoring
const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
        if (entry.entryType === 'paint') {
            console.log(`${entry.name}: ${entry.startTime}`);
        }
    });
});

if ('PerformanceObserver' in window) {
    observer.observe({ entryTypes: ['paint'] });
}
