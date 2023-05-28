@echo off
set CXX=g++
set CXX_FLAGS=-std=c++17 -Ofast
set BIN=bin
set SRC=src
set INCLUDE=include
set LIB=lib
set EXECUTABLE=main

if not exist %BIN% mkdir %BIN%

echo Compiling the C++ program...
%CXX% %CXX_FLAGS% -I%INCLUDE% -L%LIB% %SRC%\*.cpp -o %BIN%\%EXECUTABLE%
echo Done.