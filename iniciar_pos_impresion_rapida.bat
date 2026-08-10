@echo off
title Iniciar MarketERP POS - Impresion Rapida Silenciosa
echo ======================================================================
echo           MARKETERP POS - IMPRESION SILENCIOSA KIOSK MODE
echo ======================================================================
echo.
echo Abriendo navegador con configuracion de Impresion Rapida Silenciosa.
echo Las facturas y tickets se imprimiran DIRECTAMENTE a la impresora
echo predeterminada sin mostrar el cuadro de dialogo del navegador.
echo.
echo ======================================================================
echo.

start chrome --kiosk-printing --app=http://localhost:5173

if errorlevel 1 (
    start msedge --kiosk-printing --app=http://localhost:5173
)

exit
