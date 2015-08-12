$(document).ready(function(){
	//See https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
	//Open Database
	var request = indexedDB.open('customermanager',1); //(db name, version number)
	//onupgradeneeded only executes the first time file is opened, and whenever the version is upgraded
	request.onupgradeneeded = function(e){
		var db = e.target.result;
		//An Object Store is like a table in a relational db
		if(!db.objectStoreNames.contains('customers')){
			var os = db.createObjectStore('customers',{keyPath: "id", autoIncrement:true});
			//Create Index for Name
			os.createIndex('name','name',{unique:false});
		}
	}

	//Success
	request.onsuccess = function(e){
		console.log('Success: Opened Database...');
		db = e.target.result;
		//Show Customers
		showCustomers();
	}

	//Error
	request.onerror = function(e){
		console.log('Error: Could Not Open Database...');
	}
}); //end of ready

//Add Customer
function addCustomer(){
	var name = $('#name').val();
	var email = $('#email').val();
	//to interact with db create transaction object
	var transaction = db.transaction(["customers"],"readwrite");
	//Ask for ObjectStore
	var store = transaction.objectStore("customers");

	//Define Customer
	var customer = {
		name: name,
		email: email
	}

	//Perform the Add
	var request = store.add(customer);

	//Success, redirect to home page
	request.onsuccess = function(e){
		window.location.href="index.html";
	}

	//Error
	request.onerror = function(e){
		alert("Sorry, the customer was not added");
		console.log('Error', e.target.error.name);
	}
}

//Display Customers
function showCustomers(e){
	var transaction = db.transaction(["customers"],"readonly");
	//Ask for ObjectStore
	var store = transaction.objectStore("customers");
	var index = store.index('name'); //see line 12
	//Build output
	var output = '';
	//iterate with cursor
	index.openCursor().onsuccess = function(e){
		var cursor = e.target.result;
		if(cursor){
			output += "<tr id='customer_"+cursor.value.id+"'>";
			output += "<td>"+cursor.value.id+"</td>";
			output += "<td><span class='cursor customer' contenteditable='true' data-field='name' data-id='"+cursor.value.id+"'>"+cursor.value.name+"</span></td>";
			output += "<td><span class='cursor customer' contenteditable='true' data-field='email' data-id='"+cursor.value.id+"'>"+cursor.value.email+"</span></td>";
			output += "<td><a onclick='removeCustomer("+cursor.value.id+")' href=''>Delete</a></td>";
			output += "</tr>";
			cursor.continue();
		}
		$('#customers').html(output); //place in table body
	}
}

//Delete A Customer
function removeCustomer(id){
	var transaction = db.transaction(["customers"],"readwrite");
	//Ask for ObjectStore
	var store = transaction.objectStore("customers");

	var request = store.delete(id);

	//Success
	request.onsuccess = function(){
		console.log('customer '+id+' Deleted');
		$('.customer_'+id).remove(); //.remove() is jQuery function that removes without refresh
	}

	//Error
	request.onerror = function(e){
		alert("Sorry, the customer was not removed");
		console.log('Error', e.target.error.name);
	}
}

//Clear ALL Customers
function clearCustomers(){
	indexedDB.deleteDatabase('customermanager');
	window.location.href="index.html"; //redirect
}

//Update Customers, saves changes made with HTML5 attribute contenteditable
//on blur from .customer execute the function
$('#customers').on('blur','.customer',function(){
	//Newly entered text
	var newText = $(this).html();
	//Field
	var field = $(this).data('field'); //will be 'name' or 'email' see line 74, 75
	//Customer ID
	var id = $(this).data('id');

	//Get Transaction
	var transaction = db.transaction(["customers"],"readwrite");
	//Ask for ObjectStore
	var store = transaction.objectStore("customers");

	var request = store.get(id);
	//make changes
	request.onsuccess = function(){
		var data = request.result;
		if(field == 'name'){
			data.name = newText;
		} else if(field == 'email'){
			data.email = newText;
		}

		//Store Updated Text
		var requestUpdate = store.put(data);

		requestUpdate.onsuccess = function(){
			console.log('Customer field updated...');
		}

		requestUpdate.onerror = function(){
			console.log('Error: Customer field NOT updated...');
		}
	}
});
