angular.module('starter.controllers', [ 'ngCordova', 'ngStorage' ])

.controller('AddCtrl', function($scope, Db, $cordovaCamera, $cordovaToast, Util, $localStorage, $ionicLoading) {
	
	var myScroll = new IScroll('#wraper', {
		zoom: true,
		scrollX: true,
		scrollY: true,
		mouseWheel: false
	});
	
	$scope.$on('$ionicView.enter', function(e) {
		console.log("*** AddCtrl enter");
		$scope.$storage = $localStorage;
		
		$scope.$storage.currentImageData = null;
		$scope.$storage.currentThumbData = null;
		
		if ($scope.$storage.currentImageData == null)
			$scope.image = {};

		if ($scope.docexpireSelect == undefined) {
			$scope.doc.expireSelect = "365";
		}

	});
	
	var expire = 365 * 24 * 60 * 60 * 1000
	// var image = document.getElementById('pic');
	$scope.image = {};
	$scope.doc = {};

	$scope.onChangeExpireSelectValue = function(expireSelect) {
		expire = expireSelect * 24 * 60 * 60 * 1000
		console.log("expire:" + expire);
	};
	
	$scope.cancel = function(){
		$scope.$storage.currentImageData = null;
		$scope.$storage.currentThumbData = null;
		$scope.doc = {};
		$scope.image.dataURL = null;// '/9j/4AAQSkZJR';
	}

	$scope.add = function() {
		if ($scope.$storage.currentImageData != null) {

			var id = new Date().getTime();
			$ionicLoading.show();
			var doc = {
	  				id : id,
	  				tag : $scope.doc.tags,
	  				expire : expire,
	  				tst : new Date().getTime(),
	  				
	  				_attachments:{
	  				    'image': {
	  				        'content_type': 'image/png',
	  				        'data': $scope.$storage.currentImageData
	  				    }
	  				},
	  				thumb : $scope.$storage.currentImageData
	  			};
			
			 Db.put(doc).then(function() {
					$scope.$apply(function(){
						$ionicLoading.hide();
						Util.toast("Document " + doc.tag + " added");
						
						$scope.$storage.currentImageData = null;
						$scope.$storage.currentThumbData = null;
						$scope.doc = {};
						$scope.image.dataURL = null;// '/9j/4AAQSkZJR';
					});
					Db.sync();
				}).catch(function (err) {
					$ionicLoading.hide();
					Util.toast("Error: Document not added! ("+err.name+")");
				});
		} else{
			Util.toast("No image!");
		}
	}

	$scope.takePic = function() {

		if (DEV) {
			$scope.$storage.currentImageData = testImage;
			$scope.image.dataURL = "data:image/png;base64," + $scope.$storage.currentImageData;
			$scope.$storage.currentThumbData = testImage;
		}else{
		
			$cordovaCamera.getPicture({
				quality : 95,
				targetWidth : 1200,
				targetHeight : 1200,
				correctOrientation : true,
				allowEdit : false,
				encodingType : 1,
				destinationType : Camera.DestinationType.DATA_URL
			}).then(
	
			function onSuccess(imageData) {
				$scope.image.dataURL = "data:image/png;base64," + imageData;
				$scope.$storage.currentImageData = imageData;
	
//				if(window.imageResizer){
//					$ionicLoading.show();
//					window.imageResizer.resizeImage(
//						      function(data) { 
//						      
//						    	  $scope.$storage.currentThumbData = data.imageData;
//						    	  
//						      }, function (error) {
//						    	  $ionicLoading.hide();
//						    	  Util.toast("Error: " + error);
//						      }, imageData, 0.5, 0.5, {resizeType:ImageResizer.RESIZE_TYPE_FACTOR ,format:'png'});
//				}
				
				
				$cordovaCamera.cleanup();
			},
	
			function onFail(message) {
				Util.toast('Image canceled: ' + message);
			});
		}

	}

	$scope.fromGallery = function() {

		if (DEV) {
			$scope.$storage.currentImageData = testImage;
			$scope.image.dataURL = "data:image/png;base64," + $scope.$storage.currentImageData;
			$scope.$storage.currentThumbData = testImage;
			
		}else{
			
		$ionicLoading.show();
		$cordovaCamera.getPicture({
			quality : 95,
			targetWidth : 1200,
			targetHeight : 1200,
			correctOrientation : true,
			encodingType : 1,
			destinationType : Camera.DestinationType.DATA_URL,
			sourceType : 0
		}).then(
		function onSuccess(imageData) {
			$ionicLoading.hide();
			$scope.image.dataURL = "data:image/png;base64," + imageData;
			$scope.$storage.currentImageData = imageData;
			
			$cordovaCamera.cleanup();
		},

		function onFail(message) {
			$ionicLoading.hide();
			if (message != "Selection cancelled.")
				Util.toast('Image canceled: ' + message);
		});

		}
	}

})

.controller('SearchCtrl', function($scope, Db, $window, Util, $ionicLoading) {

	$scope.lastSynced = null;
	$scope.syncMsg = null;
	$scope.deleteEnabled = false;
	$scope.key = "";

	$scope.$on('$ionicView.enter', function(e) {
		console.log("SearchCtrl enter...");
		$scope.syncMsg = null;
		
	});
	
	$scope.search = function(key){
		$scope.key = key;
		if(key.length >= 2 && key != " "){
				
			if(key == "."){
				Db.find(key).then(function(list) {
					$scope.$apply(function(){
						$scope.docList = list.rows;
						
						Utils.log(list);
					});
					
				}, function(err) {
					Util.toast(err);
				});
				
			}else{
			Db.search(key).then(function(list) {
				$scope.$apply(function(){
					$scope.docList = list.rows;
					Utils.log(list);
				});
				
			}, function(err) {
				Util.toast(err);
			});
			
			}
		}
	};
	
	$scope.toView = function(docId){
		Utils.log("change view: "+docId);
		$window.location.hash = '#/tab/search/'+docId;
	}
	
	$scope.deleteDoc = function(docId){
		Utils.log("Delete doc: "+docId);
		Db.remove(docId).then(function(r){
			$scope.search($scope.key);
			Utils.log("Delete OK");
		}).catch(function(e){
			Utils.log(e);
		});
		
	}
	
	$scope.tolledgeDelete = function() {
		if(!$scope.deleteEnabled && !$scope.docList )
			Util.toast("This is used for removing documnets. Find some document first!");
		
		$scope.deleteEnabled = !$scope.deleteEnabled;
	}

	$scope.getImage = function(data) {
		return 'data:image/jpeg;base64,' + data;
	}

	$scope.sync = function() {
		$scope.lastSynced = null;
		$ionicLoading.show();

		Db.sync().then(function() {
			Db.find("Rac").then(function(list) {
				$scope.$apply(function() {
					$scope.syncMsg = null;
					$scope.lastSynced = new Date().getTime();
					$scope.docList = list.rows;
					$ionicLoading.hide();
					Util.toast("Documents are up to date!");
				});

			}, function(err) {
				$ionicLoading.hide();
				 Util.toast(err);
			});

		}).catch(function (err) {
			  Util.toast(err.name);
			  $scope.$apply(function() {
			  $scope.syncMsg = "Unable to sync!";
			  });
		});
	}
	
	

})

.controller('DocDetailCtrl', function($scope, $stateParams, Db, Util, $cordovaSocialSharing) {
	
	var myScroll = new IScroll('#wraper', {
		zoom: true,
		scrollX: true,
		scrollY: true,
		mouseWheel: false
	});
	
	$scope.$on('$ionicView.beforeEnter', function(e) {
		$scope.document = {};
		
		Utils.log("DocDetailCtrl enter...");
		Utils.log("Id=" + $stateParams.docId);
		
		Db.get($stateParams.docId, true).then(function(doc){
			Util.toast("Loaded document "+doc.tag);
			$scope.document = doc;
			Utils.log(doc);
			
			
		}).catch(function (err) {
			  Util.toast(err);
		});
		
	});
	
	$scope.share = function(docId){
		
		$cordovaSocialSharing
		    .share(null, $scope.document.tag, 'data:image/png;base64,'+$scope.document._attachments.image.data, null) // Share
																														// via
																														// native
																														// share
																														// sheet
		    .then(function(result) {
		    	 Util.toast("Document shared!");
		    }, function(err) {
		    	Util.toast("Error sharing document.");
		    });
	
	}

})

.controller('SettingsCtrl', function($scope, Db, $cordovaToast, $ionicLoading, Util) {

	$scope.imageSize = 1200;
	
	$scope.compactDB= function(){
		Db.compact();
	}
	
	$scope.syncDB = function(){
		$ionicLoading.show();
		Db.sync().then(function() {
			$ionicLoading.hide();
			Util.toast("Documents are up to date!");

		}).catch(function (err) {
			$ionicLoading.hide();
			Util.toast("Error syncing documents!");
		});
	}
	
	$scope.remoteDb = remoteDb;

});

