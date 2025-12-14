
function agregarE(){
    
$.ajax({
	url: 'server/controlador_citas.php',
	type: 'POST',
	data: {
		action: 'add_eje',
		filtro: 'algún_valor'
	},
	dataType: 'json',
	success: function(response) {
		if(response.success) {
			renderizarCitas(response.data);
		} else {
			alert('Error: ' + response.message);
		}
	}
});
}