export class TooltipManager {

    constructor(tooltip) {
        this.tooltip = tooltip
        if (!this.tooltip) {
            console.error('Tooltip element not found');
        }
    }

    updateTooltipContent(edge) {
        const tooltip = document.getElementById('tooltip');
        // console.log('TOOPLTIP EDGE',edge)
        tooltip.innerHTML = '<b>Transactions:</b>';
        edge.properties?.transactions.map(transaction => {
            tooltip.innerHTML += ` <br/>${transaction.hash}`
        })
    }

    positionTooltip(x, y) {
        const tooltip = document.getElementById('tooltip');
        // Смещение для предотвращения наложения tooltip непосредственно на курсор
        const xOffset = 10;
        const yOffset = 10;

        tooltip.style.left = `${x + xOffset}px`;
        tooltip.style.top = `${y + yOffset}px`;
    }

    showTooltip() {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.display = 'block';
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.display = 'none';
    }
}