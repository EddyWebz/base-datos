import Sortable from 'sortablejs';

document.addEventListener('DOMContentLoaded', () => {
    const p1List = document.getElementById('tabla-reporte-P1');
    const p2List = document.getElementById('tabla-reporte-P2');

    // Initialize Sortable for each list
    Sortable.create(p1List, {
        group: 'shared', // Enable sharing between P1 and P2
        animation: 150,
        onEnd: async function(evt) {
            const itemEl = evt.item; // Element being dragged
            const nuevoGaraje = evt.to.id === 'tabla-reporte-P1' ? 'P1' : 'P2';
            const id = itemEl.getAttribute('data-id');

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
        onEnd: async function(evt) {
            const itemEl = evt.item; // Element being dragged
            const nuevoGaraje = evt.to.id === 'tabla-reporte-P1' ? 'P1' : 'P2';
            const id = itemEl.getAttribute('data-id');

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
