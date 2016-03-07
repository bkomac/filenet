angular.module('starter.controllers', [ 'ngCordova' ])

.controller('AddCtrl', function($scope, Db, $cordovaCamera, $cordovaToast, Util) {
	
	var myScroll = new IScroll('#wraper', {
		zoom: true,
		scrollX: true,
		scrollY: true,
		mouseWheel: false
	});
	
	$scope.$on('$ionicView.enter', function(e) {
		console.log("*** AddCtrl enter");
		if (currentImageData == null)
			$scope.image = {};

		if ($scope.docexpireSelect == undefined) {
			$scope.doc.expireSelect = "365";
		}

	});

	var currentImageData = null;
	var expire = 365 * 24 * 60 * 60 * 1000
	// var image = document.getElementById('pic');
	$scope.image = {};
	$scope.doc = {};

	$scope.onChangeExpireSelectValue = function(expireSelect) {
		expire = expireSelect * 24 * 60 * 60 * 1000
		console.log("expire:" + expire);
	};
	
	$scope.cancel = function(){
		currentImageData = null;
		$scope.doc = {};
		$scope.image.dataURL = null;// '/9j/4AAQSkZJR';
	}

	$scope.add = function() {
		console.log("Add...");

		if (currentImageData != null) {

			var id = new Date().getTime();
			var doc = {
				id : id,
				tag : $scope.doc.tags,
				expire : expire,
				tst : new Date().getTime(),
				
				_attachments:{
				    'image': {
				        'content_type': 'image/png',
				        'data': currentImageData
				    }
				},
				
				thumb : currentImageData
				
			};

			Db.put(doc).then(function() {
				$scope.$apply(function(){
					Util.toast("Document " + doc.tag + " added");
					
					currentImageData = null;
					$scope.doc = {};
					$scope.image.dataURL = null;// '/9j/4AAQSkZJR';
				});
				Db.sync();
			}).catch(function (err) {
				  Util.toast("Error: Document not added! ("+err.name+")");
			});

		} 

	}

	$scope.takePic = function() {

		if (DEV) {
			currentImageData = testImage;
			$scope.image.dataURL = "data:image/png;base64," + currentImageData;
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
				currentImageData = imageData;
	
				$cordovaCamera.cleanup();
			},
	
			function onFail(message) {
				Util.toast('Image canceled: ' + message);
			});
		}

	}

	$scope.fromGallery = function() {

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
			$scope.image.dataURL = "data:image/png;base64," + imageData;
			currentImageData = imageData;

			$cordovaCamera.cleanup();
		},

		function onFail(message) {
			if (message != "Selection cancelled.")
				Util.toast('Image canceled: ' + message);
		});

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
		Db.find(key).then(function(list) {
			$scope.$apply(function(){
				$scope.docList = list.rows;
				
				Utils.log(list.rows);
			});
			
		}, function(err) {
			Util.toast(err);
		});
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
		    .share(null, $scope.document.tag, 'data:image/png;base64,'+$scope.document._attachments.image.data, null) // Share via native share sheet
		    .then(function(result) {
		    	 Util.toast("Document shared!");
		    }, function(err) {
		    	Util.toast("Error sharing document.");
		    });
	
	}

})

.controller('SettingsCtrl', function($scope, Db, $cordovaToast) {

	$scope.imageSize = 1200;

});

