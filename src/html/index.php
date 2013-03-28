<?php
  $assetsPath = 'assets/';
?>

<!DOCTYPE html>
<html>

	<head>
		<title>Project Title</title>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1, minimum-scale=1, maximum-scale=1">
    <meta name="keywords" content="">
    <meta name="description" content="">
    <link rel="shortcut icon" href="assets/images/favicon.ico">
    <link rel="stylesheet" href="assets/css/main.css" media="screen">
  </head>

  <body>
    <!-- temporary html contents -->
    <div id="info-container">
        Drag the fucking points to transform the image.
    </div>
    <div id="container">
        <div class="img"></div>
        <div class="pt tl"></div>
        <div class="pt tr"></div>
        <div class="pt bl"></div>
        <div class="pt br"></div>
    </div>

		<!-- COMPILE -->
    <!-- google closure -->
		<script type="text/javascript" src="../include/closure/goog/base.js"></script>
    <script>
    	goog.require('goog.array');
      goog.require('goog.dom');
      goog.require('goog.events');
      goog.require('goog.events.Event');
      goog.require('goog.events.EventTarget');
      goog.require('goog.fx.Animation');
      goog.require('goog.soy');
      goog.require('goog.style');
      goog.require('goog.string');
      goog.require('goog.math.Range');
      goog.require('goog.userAgent.product');
    </script>
    <script type="text/javascript" src="../include/js/libs/soyutils_usegoog.js"></script>

    <!-- third-party js -->
    <script type="text/javascript" src="../include/js/libs/third-party/createjs/preloadjs-0.3.0.min.js"></script>
    <script type="text/javascript" src="../include/js/libs/third-party/greensock/TweenMax.min.js"></script>
    <script type="text/javascript" src="../include/js/libs/third-party/zynga-scroller/Scroller.js"></script>
    <script type="text/javascript" src="../include/js/libs/third-party/zynga-scroller/Animate.js"></script>
    <script type="text/javascript" src="../include/js/libs/third-party/modernizr_v2.6.2.js"></script>
    <script type="text/javascript" src="../include/js/libs/third-party/PerspectiveTransform.min.js"></script>

		<!-- project js -->
    <script type="text/javascript" src="../include/js/project/templates/components.js"></script>
    <script type="text/javascript" src="../include/js/project/views/Panel.js"></script>
    <script type="text/javascript" src="../include/js/project/Main.js"></script>
    <script type="text/javascript" src="../include/js/project/projname.js"></script>
		<!-- END COMPILE -->

		<script type="text/javascript">
			projname.init();
		</script>
  </body>

</html>