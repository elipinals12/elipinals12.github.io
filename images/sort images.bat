cd "C:\users\elipi\desktop\golda's website\actual site fr no junk\images

:zine
cd zine
del all.html
for %%i in (*.JPG) do echo ^<a href="images/zine/%%i"^>>> all.html && echo 	^<img class="display-img" alt="Zine Pics" src="images/zine/%%i"/^>>> all.html && echo ^</a^>>> all.html
cd ..

:pottery
cd pottery
del all.html
for %%i in (*.JPG) do echo ^<a href="images/pottery/%%i"^>>> all.html && echo 	^<img class="display-img" alt="Pottery Pics" src="images/pottery/%%i"/^>>> all.html && echo ^</a^>>> all.html
cd ..

:photograph
cd photograph
del all.html
for %%i in (*.JPG) do echo ^<a href="images/photograph/%%i"^>>> all.html && echo 	^<img class="display-img" alt="Photograph Pics" src="images/photograph/%%i"/^>>> all.html && echo ^</a^>>> all.html
cd ..

:drawing
cd drawing
del all.html
for %%i in (*.JPG) do echo ^<a href="images/drawing/%%i"^>>> all.html && echo 	^<img class="display-img" alt="Drawing Pics" src="images/drawing/%%i"/^>>> all.html && echo ^</a^>>> all.html
cd ..