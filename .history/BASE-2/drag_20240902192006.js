document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.garage-container');

    containers.forEach(container => {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const draggedElement = document.getElementById(id);
            const newGarage = container.getAttribute('data-garage');
            
            container.appendChild(draggedElement);

            // Enviar la actualización al backend
            fetch('/api/drag', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: id,
                    newGarage: newGarage
                })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Error al actualizar el garage:', data.message);
                }
            })
            .catch(error => console.error('Error en la solicitud:', error));
        });
    });

    const items = document.querySelectorAll('.vehicle-item');
    items.forEach(item => {
        item.setAttribute('draggable', true);

        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.id);
        });
    });
});
