<?php
define('PHP_START', microtime(true));

use Cubex\Cubex;
use CubexTranslate\TranslateApplication;
use Whoops\Handler\PrettyPageHandler;
use Whoops\Run;

$loader = require_once(dirname(__DIR__) . '/vendor/autoload.php');
try
{
  $cubex = new Cubex(dirname(__DIR__), $loader);
  $cubex->handle(new TranslateApplication());
}
catch(Throwable $e)
{
  $handler = new Run();
  $handler->pushHandler(new PrettyPageHandler());
  $handler->handleException($e);
}
finally
{
  if($cubex instanceof Cubex)
  {
    //Call the shutdown command
    $cubex->shutdown();
  }
}
