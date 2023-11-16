<?php

namespace CubexTranslate;

use Packaged\Context\ContextAware;
use Packaged\Context\ContextAwareTrait;
use Packaged\Context\WithContext;
use Packaged\Context\WithContextTrait;
use Packaged\Ui\Html\TemplatedHtmlElement;
use Packaged\Ui\TemplateLoaderTrait;

class AbstractPage extends TemplatedHtmlElement implements WithContext, ContextAware
{
  use TemplateLoaderTrait;
  use ContextAwareTrait;
  use WithContextTrait;

  function pageClasses()
  {
    return '';
  }
}
