cd "C:\users\elipi\desktop\golda's website\actual site fr no junk"

setlocal EnableDelayedExpansion

:zine
cd zine
cd images

for %%i in (*.JPG) do (
	ren "%%i" zine-!random!.jpg
)

cd ../..


:pottery
cd pottery
cd images

for %%i in (*.JPG) do (
	ren "%%i" pottery-!random!.jpg
)

cd ../..


:photograph
cd photograph
cd images

for %%i in (*.JPG) do (
	ren "%%i" photograph-!random!.jpg
)

cd ../..


:drawing
cd drawing
cd images

for %%i in (*.JPG) do (
	ren "%%i" drawing-!random!.jpg
)

cd ../..


:print
cd print
cd images

for %%i in (*.JPG) do (
	ren "%%i" print-!random!.jpg
)

cd ../..


:sculpture
cd sculpture
cd images

for %%i in (*.JPG) do (
	ren "%%i" sculpture-!random!.jpg
)

cd ../..


exit