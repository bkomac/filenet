var remoteDb = 'http://ws.komac.si:40000/filenetdb';

angular.module('starter.services', ['ngCordova'])

.factory('Db', function($q, Util) {
	
	// var PouchDB = require('pouchdb');
	// PouchDB.plugin(require('pouchdb-quick-search'));
	
	
	var pouchDbName = 'flieNetDb';
	var pdb = new PouchDB(pouchDbName);
	
	

	var remotePdb = new PouchDB(remoteDb);

	return {
		
		search : function(tag){
			Utils.log("search:"+tag);
			return pdb.search({
				  query: tag,
				  fields: ['tag'],
				  mm: '10%',
				  include_docs: true
				});
			
		},

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
			Utils.log("key:"+tag.toUpperCase());
			tag = tag.toUpperCase();
			if(tag == '.'){
				return pdb.allDocs({include_docs: true});
				
			}else{
				return pdb.query(
						function (doc, emit) {
					
							if(doc.tag != null && tag != '')
								emit(doc.tag.toUpperCase());
						
						}, {startkey: tag, endkey: tag + "\u9999", include_docs: true});
			}
			
		},
		
		find2 : function(tag){
			var tag = tag.toUpperCase();
			
			Utils.log("key:"+tag);
			var ddoc = {
					  _id: '_design/index',
					  views: {
					    index: {
					      map: function (doc) {
									emit(doc.tag.toUpperCase());
								}.toString()
					    }
					  }
					};

				return pdb.put(ddoc).catch(function (err) {
					  if (err.status !== 409) {
						  Utils.log("E:"+err);
					    throw err;
					  }
					  // ignore if doc already exists
					}).then(function () {
					  return pdb.query('index', {startkey: tag, endkey: tag + "\u9999", include_docs: true});
					});
			
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
		
		remove : function(id) {
			return pdb.get(id).then(function(doc) {
				   pdb.remove(doc);
				});
				
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
		
		compact : function() {

			pdb.compact().then(function (result) {
				Util.toast("DB compact finished.");
			}).catch(function (err) {
				Util.toast("Error with DB compaction.");
			});
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

var doc = {
	tag : '',
	expire : 365,
	tst : new Date().getTime(),
	
	_attachments:{
	    image: {
	        content_type: 'image/png',
	        data: ''
	    }
	},
	thumb : ''
};
