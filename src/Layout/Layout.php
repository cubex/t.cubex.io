<?php

namespace CubexTranslate\Layout;

use Packaged\Context\ContextAware;
use Packaged\Context\ContextAwareTrait;
use Packaged\Context\WithContext;
use Packaged\Context\WithContextTrait;
use Packaged\Dispatch\ResourceManager;
use Packaged\Ui\Element;

class Layout extends Element implements ContextAware, WithContext
{
  use ContextAwareTrait;
  use WithContextTrait;

  protected $_content = null;
  protected $_pageClasses = '';

  public function getContent()
  {
    return $this->_content;
  }

  public function setContent($content): self
  {
    $this->_content = $content;
    return $this;
  }

  public function render(): string
  {
    ResourceManager::resources()->requireCss('core.css')->requireJs('core.js');
    return parent::render();
  }

  public function getPageClasses()
  {
    return $this->_pageClasses;
  }

  public function setPageClasses($pageClasses): self
  {
    $this->_pageClasses = $pageClasses;
    return $this;
  }
}
