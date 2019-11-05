cd "C:\users\elipi\desktop\golda's website\actual site fr no junk"

:zine
cd zine
del all.html
rmdir /s /q pages
md pages
cd images

for %%i in (*.JPG) do (
    echo ^<a href="pages/%%~ni.html"^>
    echo 	^<img class="display-img" alt="Zine Pics" src="images/%%i"/^>
    echo ^</a^>
) >> ../all.html

for %%i in (*.JPG) do (
    echo ^<html^>
    echo 	^<head^>
    echo 		^<meta name="viewport" content="width=device-width, initial-scale=1"^>
    echo 		^<link rel="stylesheet" type="text/css" href="../../style.css"^>
    echo 		^<title^>GOLDA~Image^</title^>
    echo 		^<link rel="icon" href="../../images/golda_logo.png"^>
    echo 	^</head^>
    echo 	^<header^>
    echo 		^<nav class="topnav"^>
    echo 			^<a href="../../index.html"^>Home^</a^>
    echo 			^<a href="../../pottery/pottery.html"^>Ceramics^</a^>
    echo 			^<a href="../../drawing/drawing.html"^>Drawings and Paintings^</a^>
    echo 			^<a href="../../photograph/photograph.html"^>Photography^</a^>
    echo 			^<a class="active" href="../../zine/zine.html"^>Zine^</a^>
    echo 			^<a href="../../contact.html"^>Contact and Bio^</a^>
    echo 		^</nav^>
    echo 	^</header^>
    echo 	^<body bgcolor=#000000^>
    echo 		^<img class="big-img" src="../images/%%i" alt="%%i Enlarged"^>
    echo 		^<button class="back-btn" onclick="window.history.back()"^>^&#10094^&#10094 Go Back^</button^>
    echo 	^</body^>
    echo 	^<footer^>
    echo 		^<small class="right-align"^>Copyright ^&copy;
	echo			^<script^>
	echo				document.write^(new Date^(^).getFullYear^(^)^)
	echo			^</script^>
	echo			Golda Pinals. All Rights Reserved
	echo		^</small^>
	echo		^<small class="left-align"^>
	echo			Any problems or recomendations for the site? Email me at elipinals12@gmail.com
	echo		^</small^>
    echo 	^</footer^>
    echo ^</html^>
) >> ../pages/%%~ni.html

cd ../..


:pottery
cd pottery
del all.html
rmdir /s /q pages
md pages
cd images

for %%i in (*.JPG) do (
    echo ^<a href="pages/%%~ni.html"^>
    echo 	^<img class="display-img" alt="Pottery Pics" src="images/%%i"/^>
    echo ^</a^>
) >> ../all.html

for %%i in (*.JPG) do (
    echo ^<html^>
    echo 	^<head^>
    echo 		^<meta name="viewport" content="width=device-width, initial-scale=1"^>
    echo 		^<link rel="stylesheet" type="text/css" href="../../style.css"^>
    echo 		^<title^>GOLDA~Image^</title^>
    echo 		^<link rel="icon" href="../../images/golda_logo.png"^>
    echo 	^</head^>
    echo 	^<header^>
    echo 		^<nav class="topnav"^>
    echo 			^<a href="../../index.html"^>Home^</a^>
    echo 			^<a class="active" href="../../pottery/pottery.html"^>Ceramics^</a^>
    echo 			^<a href="../../drawing/drawing.html"^>Drawings and Paintings^</a^>
    echo 			^<a href="../../photograph/photograph.html"^>Photography^</a^>
    echo 			^<a href="../../zine/zine.html"^>Zine^</a^>
    echo 			^<a href="../../contact.html"^>Contact and Bio^</a^>
    echo 		^</nav^>
    echo 	^</header^>
    echo 	^<body bgcolor=#000000^>
    echo 		^<img class="big-img" src="../images/%%i" alt="%%i Enlarged"^>
    echo 		^<button class="back-btn" onclick="window.history.back()"^>^&#10094^&#10094 Go Back^</button^>
    echo 	^</body^>
    echo 	^<footer^>
    echo 		^<small class="right-align"^>Copyright ^&copy;
	echo			^<script^>
	echo				document.write^(new Date^(^).getFullYear^(^)^)
	echo			^</script^>
	echo			Golda Pinals. All Rights Reserved
	echo		^</small^>
	echo		^<small class="left-align"^>
	echo			Any problems or recomendations for the site? Email me at elipinals12@gmail.com
	echo		^</small^>
    echo 	^</footer^>
    echo ^</html^>
) >> ../pages/%%~ni.html

cd ../..


:photograph
cd photograph
del all.html
rmdir /s /q pages
md pages
cd images

for %%i in (*.JPG) do (
    echo ^<a href="pages/%%~ni.html"^>
    echo 	^<img class="display-img" alt="Photograph Pics" src="images/%%i"/^>
    echo ^</a^>
) >> ../all.html

for %%i in (*.JPG) do (
    echo ^<html^>
    echo 	^<head^>
    echo 		^<meta name="viewport" content="width=device-width, initial-scale=1"^>
    echo 		^<link rel="stylesheet" type="text/css" href="../../style.css"^>
    echo 		^<title^>GOLDA~Image^</title^>
    echo 		^<link rel="icon" href="../../images/golda_logo.png"^>
    echo 	^</head^>
    echo 	^<header^>
    echo 		^<nav class="topnav"^>
    echo 			^<a href="../../index.html"^>Home^</a^>
    echo 			^<a href="../../pottery/pottery.html"^>Ceramics^</a^>
    echo 			^<a href="../../drawing/drawing.html"^>Drawings and Paintings^</a^>
    echo 			^<a class="active" href="../../photograph/photograph.html"^>Photography^</a^>
    echo 			^<a href="../../zine/zine.html"^>Zine^</a^>
    echo 			^<a href="../../contact.html"^>Contact and Bio^</a^>
    echo 		^</nav^>
    echo 	^</header^>
    echo 	^<body bgcolor=#000000^>
    echo 		^<img class="big-img" src="../images/%%i" alt="%%i Enlarged"^>
    echo 		^<button class="back-btn" onclick="window.history.back()"^>^&#10094^&#10094 Go Back^</button^>
    echo 	^</body^>
    echo 	^<footer^>
    echo 		^<small class="right-align"^>Copyright ^&copy;
	echo			^<script^>
	echo				document.write^(new Date^(^).getFullYear^(^)^)
	echo			^</script^>
	echo			Golda Pinals. All Rights Reserved
	echo		^</small^>
	echo		^<small class="left-align"^>
	echo			Any problems or recomendations for the site? Email me at elipinals12@gmail.com
	echo		^</small^>
    echo 	^</footer^>
    echo ^</html^>
) >> ../pages/%%~ni.html

cd ../..


:drawing
cd drawing
del all.html
rmdir /s /q pages
md pages
cd images

for %%i in (*.JPG) do (
    echo ^<a href="pages/%%~ni.html"^>
    echo 	^<img class="display-img" alt="Drawing Pics" src="images/%%i"/^>
    echo ^</a^>
) >> ../all.html

for %%i in (*.JPG) do (
    echo ^<html^>
    echo 	^<head^>
    echo 		^<meta name="viewport" content="width=device-width, initial-scale=1"^>
    echo 		^<link rel="stylesheet" type="text/css" href="../../style.css"^>
    echo 		^<title^>GOLDA~Image^</title^>
    echo 		^<link rel="icon" href="../../images/golda_logo.png"^>
    echo 	^</head^>
    echo 	^<header^>
    echo 		^<nav class="topnav"^>
    echo 			^<a href="../../index.html"^>Home^</a^>
    echo 			^<a href="../../pottery/pottery.html"^>Ceramics^</a^>
    echo 			^<a class="active" href="../../drawing/drawing.html"^>Drawings and Paintings^</a^>
    echo 			^<a href="../../photograph/photograph.html"^>Photography^</a^>
    echo 			^<a href="../../zine/zine.html"^>Zine^</a^>
    echo 			^<a href="../../contact.html"^>Contact and Bio^</a^>
    echo 		^</nav^>
    echo 	^</header^>
    echo 	^<body bgcolor=#000000^>
    echo 		^<img class="big-img" src="../images/%%i" alt="%%i Enlarged"^>
    echo 		^<button class="back-btn" onclick="window.history.back()"^>^&#10094^&#10094 Go Back^</button^>
    echo 	^</body^>
    echo 	^<footer^>
    echo 		^<small class="right-align"^>Copyright ^&copy;
	echo			^<script^>
	echo				document.write^(new Date^(^).getFullYear^(^)^)
	echo			^</script^>
	echo			Golda Pinals. All Rights Reserved
	echo		^</small^>
	echo		^<small class="left-align"^>
	echo			Any problems or recomendations for the site? Email me at elipinals12@gmail.com
	echo		^</small^>
    echo 	^</footer^>
    echo ^</html^>
) >> ../pages/%%~ni.html

cd ../..


exit