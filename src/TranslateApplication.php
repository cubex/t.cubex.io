<?php
namespace CubexTranslate;

use Cubex\Controller\Controller;
use CubexTranslate\DecodePage\DecodePage;
use CubexTranslate\EncodePage\EncodePage;
use CubexTranslate\Layout\Layout;
use CubexTranslate\TranslatePage\TranslatePage;
use Packaged\Context\Context;
use Packaged\Dispatch\Dispatch;
use Packaged\Dispatch\Resources\ResourceFactory;
use Packaged\Helpers\Path;
use Packaged\Http\Response;
use Packaged\Http\Responses\JsonResponse;
use Packaged\I18n\Tools\TextIDGenerator;
use Packaged\Routing\Handler\FuncHandler;
use Packaged\Routing\HealthCheckCondition;
use Packaged\Routing\Route;

class TranslateApplication extends Controller
{
  const DISPATCH_PATH = '/_res';

  protected function _initialize()
  {
    parent::_initialize();
    $this->_initDispatch();
  }

  protected function _initDispatch()
  {
    $ctx = $this->getContext();
    $dispatch = new Dispatch($ctx->getProjectRoot(), self::DISPATCH_PATH);

    Dispatch::bind($dispatch);
  }

  protected function _generateRoutes()
  {
    yield Route::with(new HealthCheckCondition())->setHandler(
      function () { return Response::create('OK'); }
    );

    $resourceRoutes = ['manifest.json'];
    foreach($resourceRoutes as $route)
    {
      yield self::_route(
        '/' . $route,
        static function (Context $c) use ($route) {
          return JsonResponse::raw(file_get_contents(Path::system($c->getProjectRoot(), 'public/' . $route)));
        }
      );
    }

    $textRoutes = ['service-worker.js', 'icon512_maskable.png', 'icon512_rounded.png'];
    foreach($textRoutes as $route)
    {
      yield self::_route(
        '/' . $route,
        static function (Context $c) use ($route) {
          return ResourceFactory::fromFile(Path::system($c->getProjectRoot(), 'public/' . $route));
        }
      );
    }

    yield self::_route(
      self::DISPATCH_PATH,
      new FuncHandler(
        static function (Context $c) {
          return Dispatch::instance()->handleRequest($c->request());
        }
      )
    );

    yield self::_route('/decode', 'decode');
    yield self::_route('/encode', 'encode');

    return 'translate';
  }

  public function processTranslate(Context $ctx)
  {
    $text = trim($ctx->request()->get('text'));
    $key = (new TextIDGenerator())->generateId($text);

    return TranslatePage::withContext($this, $key, $text);
  }

  public function processDecode(Context $ctx)
  {
    return DecodePage::withContext($this);
  }

  public function processEncode(Context $ctx)
  {
    return EncodePage::withContext($this);
  }

  protected function _prepareResponse(Context $c, $result, $buffer = null)
  {
    if(!$this->_isAppropriateResponse($result))
    {
      return parent::_prepareResponse($c, $result, $buffer);
    }

    $theme = Layout::withContext($this);
    $theme->setContent($result);

    return parent::_prepareResponse($c, $theme, $buffer);
  }

  protected function _isAppropriateResponse($result): bool
  {
    return $result instanceof AbstractPage || is_scalar($result) || is_array($result);
  }
}
