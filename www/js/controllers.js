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
			$scope.image.dataURL = "data:image/jpeg;base64," + currentImageData;
		}else{
		
			$cordovaCamera.getPicture({
				quality : 95,
				targetWidth : 1000,
				targetHeight : 1000,
				correctOrientation : true,
				allowEdit : false,
				destinationType : Camera.DestinationType.DATA_URL
			}).then(
	
			function onSuccess(imageData) {
				$scope.image.dataURL = "data:image/jpeg;base64," + imageData;
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
			targetWidth : 1000,
			targetHeight : 1000,
			correctOrientation : true,
			destinationType : Camera.DestinationType.DATA_URL,
			sourceType : 0
		}).then(

		function onSuccess(imageData) {
			$scope.image.dataURL = "data:image/jpeg;base64," + imageData;
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

	$scope.$on('$ionicView.enter', function(e) {
		console.log("SearchCtrl enter...");

		Db.find("Rac").then(function(list) {
			$scope.$apply(function(){
				$scope.docList = list.rows;
				$scope.syncMsg = null;
				
				Utils.log(list.rows);
			});
			
		}, function(err) {
			Util.toast(err);
		});
	});

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

.controller('DocDetailCtrl', function($scope, $stateParams, Db, Util) {
	
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

})

.controller('SettingsCtrl', function($scope, Db, $cordovaToast) {

	window.requestFileSystem(window.PERSISTENT, 5 * 1024 * 1024, function(fs) {
		console.log("FS ok");
	}, function(e) {
		Utils.log("FS not ok ");
		Utils.echo(e);
	});

	$scope.backups = [];
	$scope.restore = function() {
		Db.restoreDBfromFile();
	};

	$scope.backup = function() {
		Db.backupDBtoFile();
	};

});

