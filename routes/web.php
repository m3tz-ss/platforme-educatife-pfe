<?php

use Illuminate\Support\Facades\Route;

Route::get('/test-debug', function () {
    return view('welcome');
});
