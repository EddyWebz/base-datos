document.addEventListener('DOMContentLoaded', () => {
    const p1List = document.querySelector('#tabla-reporte-P1 tbody');
    const p2List = document.querySelector('#tabla-reporte-P2 tbody');

    Sortable.create(p1List, {
        group: 'shared',
        animation: 150,
        handle: 'tr',
        onEnd: async function(evt) {
            const itemEl = evt.item;
            const nuevoGaraje = evt.to.closest('table').id === 'tabla-reporte-P1' ? 'P1' : 'P2';
            const id = itemEl.querySelector('td[data-id]').getAttribute('data-id');

            const response = await fetch('/api/actualizar-garaje', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, nuevoGaraje })
            });

            if (!response.ok) {
                evt.from.appendChild(itemEl);
            }
        }
    });

    Sortable.create(p2List, {
        group: 'shared',
        animation: 150,
        handle: 'tr',
        onEnd: async function(evt) {
            const itemEl = evt.item;
            const nuevoGaraje = evt.to.closest('table').id === 'tabla-reporte-P1' ? 'P1' : 'P2';
            const id = itemEl.querySelector('td[data-id]').getAttribute('data-id');

            const response = await fetch('/api/actualizar-garaje', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, nuevoGaraje })
            });

            if (!response.ok) {
                evt.from.appendChild(itemEl);
            }
        }
    });
});
