<?php
namespace CubexTranslate;

use Cubex\Controller\Controller;
use Packaged\Context\Context;
use Packaged\Http\Response;
use Packaged\I18n\Tools\TextIDGenerator;
use Packaged\Routing\HealthCheckCondition;
use Packaged\Routing\Route;
use Packaged\SafeHtml\SafeHtml;

class TranslateApplication extends Controller
{
  protected function _generateRoutes()
  {
    yield Route::with(new HealthCheckCondition())->setHandler(
      function () { return Response::create('OK'); }
    );

    return 'translate';
  }

  public function processTranslate(Context $ctx)
  {
    $text = trim($ctx->request()->get('text'));
    $key = (new TextIDGenerator())->generateId($text);
    return new SafeHtml(
      '<div style="background:#2d2d2d; position: absolute; top:0; left:0; right:0; bottom:0; padding: 10px;">'
      . '<form method="post" action="' . $ctx->request()->path() . '" style="width: 100%; ">'
      . '<textarea name="text" style="width:100%; min-height:50px; font-size:15px; padding: 15px; '
      . 'background: rgba(255,255,255,0.1); border: 1px solid #454545; color: #c7d7e6">' . $text . '</textarea>'
      . '<input type="submit" value="Translate" '
      . 'style="padding: 10px; width: 100%; border: 1px solid; '
      . 'background: #3c49aa; color: #c4c6da; font-size: 14px; margin-top: 10px;"/>'
      . ($text ?
        '<p style="color: #aaa; font-size: 10px; font-family: Monaco, SF Mono, monospace; margin: 10px 0 0 0;">CODE:</p>'
        . '<p style="background: #373d44; color: white; padding: 15px; margin:5px 0; user-select: all;'
        . 'font-family: Monaco, SF Mono, monospace; font-size:14px;">' . $this->_createTranslatable(
          $key,
          $text
        ) . '</p>'
        . '<p style="color: #aaa; font-size: 10px; font-family: Monaco, SF Mono, monospace; margin: 10px 0 0 0;">KEY:</p>'
        . '<p style="background: #373d44; color: white; padding: 15px; margin:5px 0; user-select: all;'
        . 'font-family: Monaco, SF Mono, monospace; font-size:14px;">' . $key . '</p>'
        : '')
      . '</form>'
      . '</div>'
    );
  }

  protected function _createTranslatable($key, $text)
  {
    $matches = [];
    preg_match_all('/\{(\w+)\}/', $text, $matches);
    $replacements = '';
    if(!empty($matches[1]))
    {
      $arrVals = [];
      foreach($matches[1] as $match)
      {
        $arrVals[] = "'$match' => ''";
      }
      $replacements = ', [' . implode(',', $arrVals) . ']';
    }
    return '$this->_(' . "'" . $key . "'" . ", '" . addcslashes($text, "'") . "'" . $replacements . ')';
  }
}
