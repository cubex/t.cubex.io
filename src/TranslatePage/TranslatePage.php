<?php

namespace CubexTranslate\TranslatePage;

use CubexTranslate\AbstractPage;

class TranslatePage extends AbstractPage
{

  public $text;
  public $key;

  public function __construct($key, $text)
  {
    $this->key = $key;
    $this->text = $text;
  }

  public function createTranslatable($key, $text)
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
