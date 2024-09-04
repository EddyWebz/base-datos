document.addEventListener('DOMContentLoaded', () => {
    const p1List = document.querySelector('#tabla-reporte-P1 tbody');
    const p2List = document.querySelector('#tabla-reporte-P2 tbody');

    // Initialize Sortable for each list
    Sortable.create(p1List, {
        group: 'shared', // Enable sharing between P1 and P2
        animation: 150,
        handle: 'tr', // Ensure that only rows are draggable
        onEnd: async function(evt) {
            const itemEl = evt.item; // Element being dragged
            const nuevoGaraje = evt.to.closest('table').id === 'tabla-reporte-P1' ? 'P1' : 'P2';
            const id = itemEl.querySelector('td[data-id]').getAttribute('data-id');

            // Logic to update the database
            const response = await fetch('/api/actualizar-garaje', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, nuevoGaraje })
            });

            if (!response.ok) {
                alert('Error al mover el vehículo.');
                evt.from.appendChild(itemEl); // Revert if there's an error
            }
        }
    });

    Sortable.create(p2List, {
        group: 'shared',
        animation: 150,
        handle: 'tr', // Ensure that only rows are draggable
        onEnd: async function(evt) {
            const itemEl = evt.item; // Element being dragged
            const nuevoGaraje = evt.to.closest('table').id === 'tabla-reporte-P1' ? 'P1' : 'P2';
            const id = itemEl.querySelector('td[data-id]').getAttribute('data-id');

            // Logic to update the database
            const response = await fetch('/api/actualizar-garaje', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, nuevoGaraje })
            });

            if (!response.ok) {
                alert('Error al mover el vehículo.');
                evt.from.appendChild(itemEl); // Revert if there's an error
            }
        }
    });
});
