angular.module('starter.services', ['ngCordova'])

.factory('Db', function($q) {
	
	var pouchDbName = 'flieNetDb';
	var pdb = new PouchDB(pouchDbName);

	var remotePdb = new PouchDB('http://ws.komac.si:40000/filenetdb');

	return {

		findX : function(tag) {
			console.log("find: " + tag);
			var dfd = $q.defer();
			
			if(db==undefined){
				dfd.reject("Db not ready");
				console.log("Db not ready");
				return dfd.promise;
			}
			
			var tx = db.transaction(objectStore, "readonly");
			var store = tx.objectStore(objectStore);
			var index = store.index("by_tag");
			var list = [];

			var keyRange = IDBKeyRange.lowerBound(0);
			var request = index.openCursor(keyRange);
			
			tx.oncomplete = function(e) {
				console.log("tx.oncomplete...");
				dfd.resolve(list);
				
				// callback(list);
			};
			
			request.onsuccess = function(e) {
				
				 var result = e.target.result;
				 if (!!result == false) {
					 dfd.resolve(list);
					 console.log("Not found");
				     // return;
				 }

				if(result){
				 list.push(result.value);
				 console.log("result found");
				 result.continue();
				}
			
			};
			
			return pdb.allDocs({include_docs: true});
		},
		
		find : function(tag) {
			
			return pdb.allDocs({include_docs: true});
			
		},

		put : function(document) {

			document._id = new Date().toJSON();
			
			return pdb.put(document);
		},
		
		get : function(id, atachments) {
			
			atachments = atachments || false;
			
			if(atachments)
				return pdb.get(id, {attachments: true});
			else
				return pdb.get(id);
		},
			sync : function() { 
			pdb.sync(remotePdb);
		},
		
		getAll : function() {
			
			return pdb.allDocs({include_docs: true});
		},
		
		sync : function() { 
			
			return pdb.sync(remotePdb);
		},
		
		backupDBtoFile : function() {
			
			function onInitFs(fs) {
				
				  fs.root.getFile('db.json', {create: true}, function(fileEntry) {

				    // Create a FileWriter object for our FileEntry (log.txt).
				    fileEntry.createWriter(function(fileWriter) {

				      fileWriter.onwriteend = function(e) {
				        console.log('Write completed.');
				      };

				      fileWriter.onerror = function(e) {
				        console.log('Write failed: ' + e.toString());
				      };
				      var tx = db.transaction([objectStore], "readonly");
				      var store = tx.objectStore(objectStore);
						
				      store.getAll().onsuccess = function(evt) {
							
								// Create a new Blob and write it to log.txt.
							    var blob = new Blob([JSON.stringify(evt.target.result)], {type: 'text/plain'});
								
							    fileWriter.write(blob);
						}

				    }, Utils.errorHandler);

				  }, Utils.errorHandler);

				}

			window.requestFileSystem(window.TEMPORARY, 1024*1024, onInitFs, Utils.errorHandler);
		},
		
		restoreDBfromFile : function() {
			
			function onInitFs(fs) {

				  fs.root.getFile('db.json', {}, function(fileEntry) {

				    // Get a File object representing the file,
				    // then use FileReader to read its contents.
				    fileEntry.file(function(file) {
				       var reader = new FileReader();

				       reader.onloadend = function(e) {
				         Utils.log("data to retore: "+this.result);
				         if(this.result != ""){
								var tx = db.transaction([objectStore], "readwrite");
								var store = tx.objectStore(objectStore);
								var i;
								
								var data = JSON.parse(this.result);
								for (i = 0; i < data.length; i++) { 
								    console.log("restore: ", data[i]);
								    var request = store.add(data[i]);
								}
							}
				       };

				       reader.readAsText(file);
				    }, Utils.errorHandler);

				  }, Utils.errorHandler);

				}

			window.requestFileSystem(window.TEMPORARY, 1024*1024, onInitFs, Utils.errorHandler);
			
			function errorHandler (e){
				Utils.log("errer:"+e);
			}
		},
		
		getAll : function() {
			var tx = db.transaction([objectStore], "readonly");
			var store = tx.objectStore(objectStore);
			
			var dfd = $q.defer();
			
			store.getAll().onsuccess = function(evt) {
				console.log("getAll ", evt.target);
				window.localStorage['backup'] = JSON.stringify(evt.target.result);
				dfd.resolve(evt.target.result);
			}
			return dfd.promise;
		},

	};
})

.factory('Util', function($cordovaToast) {
	
	return {
		toast : function(msg) { 
		
			if(!DEV)
				$cordovaToast.showShortCenter(msg);
			else
				Utils.log(msg);
		}
		
	}
});

var document = {
	id: 0,
	tag : '',
	tst : null,
	image : null

}
