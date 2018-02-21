import imageBmp from 'res/img/image-bmp.svg'
import imageGif from 'res/img/image-gif.svg'
import imageJpeg from 'res/img/image-jpeg.svg'
import imagePng from 'res/img/image-png.svg'
import imageSvg from 'res/img/image-svg+xml-compressed.svg'
import imageGeneric from 'res/img/image-x-generic.svg'

import audioMidi from 'res/img/audio-midi.svg'
import audioFlac from 'res/img/audio-x-flac.svg'
import audioMpeg from 'res/img/audio-x-mpeg.svg'
import audioWav from 'res/img/audio-x-wav.svg'
import audioOgg from 'res/img/application-ogg.svg'
import audioGeneric from 'res/img/audio-x-generic.svg'

import videoMp4 from 'res/img/video-mp4.svg'
import videoWebm from 'res/img/video-webm.svg'
import videoMkv from 'res/img/video-x-matroska.svg'
import videoTheora from 'res/img/video-x-theora+ogg.svg'
import videoWmv from 'res/img/video-x-wmv.svg'
import videoGeneric from 'res/img/video-x-generic.svg'

import textCss from 'res/img/text-css.svg'
import textCsv from 'res/img/text-csv.svg'
import textDockerfile from 'res/img/text-dockerfile.svg'
import textHtml from 'res/img/text-html.svg'
import textRtf from 'res/img/text-rtf.svg'
import textRust from 'res/img/text-rust.svg'
import textWiki from 'res/img/text-wiki.svg'
import textChangelog from 'res/img/text-x-changelog.svg'
import textCmake from 'res/img/text-x-cmake.svg'
import textCsharp from 'res/img/text-x-csharp.svg'
import textCsrc from 'res/img/text-x-csrc.svg'
import textCppSrc from 'res/img/text-x-c++src.svg'
import textGo from 'res/img/text-x-go.svg'
import textHaskell from 'res/img/text-x-haskell.svg'
import textHex from 'res/img/text-x-hex.svg'
import textLua from 'res/img/text-x-lua.svg'
import textMd from 'res/img/text-x-markdown.svg'
import textXml from 'res/img/text-xml.svg'
import textPatch from 'res/img/text-x-patch.svg'
import textQml from 'res/img/text-x-qml.svg'
import textRlang from 'res/img/text-x-r.svg'
import textSass from 'res/img/text-x-sass.svg'
import textScala from 'res/img/text-x-scala.svg'
import textScript from 'res/img/text-x-script.svg'
import textTex from 'res/img/text-x-tex.svg'
import textPython from 'res/img/application-x-python-bytecode.svg'
import textGeneric from 'res/img/text-x-generic.svg'

import atom from 'res/img/application-atom+xml.svg'
import certificate from 'res/img/application-certificate.svg'
import epub from 'res/img/application-epub+zip.svg'
import illustrator from 'res/img/application-illustrator.svg'
import json from 'res/img/application-json.svg'
import octetStream from 'res/img/application-octet-stream.svg'
import pdf from 'res/img/application-pdf.svg'
import encrypted from 'res/img/application-pgp-encrypted.svg'
import signature from 'res/img/application-pgp-signature.svg'
import postscript from 'res/img/application-postscript.svg'
import archive from 'res/img/application-x-ar.svg'
import bittorrent from 'res/img/application-x-bittorrent.svg'
import blender from 'res/img/application-x-blender.svg'
import bzip from 'res/img/application-x-bzip.svg'
import iso from 'res/img/application-x-cd-image.svg'
import tar from 'res/img/application-x-compressed-tar.svg'
import deb from 'res/img/application-x-deb.svg'
import designer from 'res/img/application-x-designer.svg'
import desktop from 'res/img/application-x-desktop.svg'
import executable from 'res/img/application-x-executable.svg'
import font from 'res/img/application-x-font-otf.svg'
import gzip from 'res/img/application-x-gzip.svg'
import java from 'res/img/application-x-java.svg'
import jar from 'res/img/application-x-java-archive.svg'
import js from 'res/img/application-x-javascript.svg'
import krita from 'res/img/application-x-krita.svg'
import lyx from 'res/img/application-x-lyx.svg'
import macbin from 'res/img/application-x-macbinary.svg'
import winbin from 'res/img/application-x-ms-dos-executable.svg'
import winshortcut from 'res/img/application-x-ms-shortcut.svg'
import pemKey from 'res/img/application-x-pem-key.svg'
import perl from 'res/img/application-x-perl.svg'
import php from 'res/img/application-x-php.svg'
import ruby from 'res/img/application-x-ruby.svg'
import sharedlib from 'res/img/application-x-sharedlib.svg'
import flash from 'res/img/application-x-shockwave-flash.svg'
import zip from 'res/img/application-zip.svg'

import vbHdd from 'res/img/virtualbox-hdd.svg'
import vbOva from 'res/img/virtualbox-ova.svg'
import vbOvf from 'res/img/virtualbox-ovf.svg'
import vbVbox from 'res/img/virtualbox-vbox.svg'
import vbExtpack from 'res/img/virtualbox-vbox-extpack.svg'
import vbVdi from 'res/img/virtualbox-vdi.svg'
import vbVmdk from 'res/img/virtualbox-vmdk.svg'

import other from 'res/img/application-x-zerosize.svg'

// {regex: /^*$/, thumb: },
const mappings = [
  {regex: /^image bmp*$/, thumb: imageBmp},
  {regex: /^image gif*$/, thumb: imageGif},
  {regex: /^image jpeg*$/, thumb: imageJpeg},
  {regex: /^image png*$/, thumb: imagePng},
  {regex: /^image svg*$/, thumb: imageSvg},
  {regex: /^image*$/, thumb: imageGeneric},

  {regex: /^audio midi*$/, thumb: audioMidi},
  {regex: /^audio flac*$/, thumb: audioFlac},
  {regex: /^audio mpeg*$/, thumb: audioMpeg},
  {regex: /^audio wav*$/, thumb: audioWav},
  {regex: /^audio ogg*$/, thumb: audioOgg},
  {regex: /^audio*$/, thumb: audioGeneric},

  {regex: /^video mp4*$/, thumb: videoMp4},
  {regex: /^video webm*$/, thumb: videoWebm},
  {regex: /^video x-matroska*$/, thumb: videoMkv},
  {regex: /^video x-theora*$/, thumb: videoTheora},
  {regex: /^video x-wmv*$/, thumb: videoWmv},
  {regex: /^video*$/, thumb: videoGeneric},

  {regex: /^text css*/, thumb: textCss},
  {regex: /^text csv*/, thumb: textCsv},
  {regex: /^text dockerfile*/, thumb: textDockerfile},
  {regex: /^text html*/, thumb: textHtml},
  {regex: /^text rtf*/, thumb: textRtf},
  {regex: /^text rust*/, thumb: textRust},
  {regex: /^text wiki*/, thumb: textWiki},
  {regex: /^text x-changelog*/, thumb: textChangelog},
  {regex: /^text x-cmake*/, thumb: textCmake},
  {regex: /^text x-csharp*/, thumb: textCsharp},
  {regex: /^text x-csrc*/, thumb: textCsrc},
  {regex: /^text x-c\+\+src*/, thumb: textCppSrc},
  {regex: /^text x-go*/, thumb: textGo},
  {regex: /^text x-haskell*/, thumb: textHaskell},
  {regex: /^text x-hex*/, thumb: textHex},
  {regex: /^text x-lua*/, thumb: textLua},
  {regex: /^text (x-)?markdown*/, thumb: textMd},
  {regex: /^text xml*/, thumb: textXml},
  {regex: /^text x-patch*/, thumb: textPatch},
  {regex: /^text x-qml*/, thumb: textQml},
  {regex: /^text x-r*/, thumb: textRlang},
  {regex: /^text x-s(a|c)ss*/, thumb: textSass},
  {regex: /^text x-scala*/, thumb: textScala},
  {regex: /^text x-(shell)?script*/, thumb: textScript},
  {regex: /^text x-tex*/, thumb: textTex},
  {regex: /^text x-python*$/, thumb: textPython},
  {regex: /^text*/, thumb: textGeneric},

  {regex: /^application atom*$/, thumb: atom},
  {regex: /^application certificate*$/, thumb: certificate},
  {regex: /^application epub*$/, thumb: epub},
  {regex: /^application illustrator*$/, thumb: illustrator},
  {regex: /^application json*$/, thumb: json},
  {regex: /^application octet-stream*$/, thumb: octetStream},
  {regex: /^application pdf*$/, thumb: pdf},
  {regex: /^application pgp-encrypted*$/, thumb: encrypted},
  {regex: /^application pgp-signature*$/, thumb: signature},
  {regex: /^application postscript*$/, thumb: postscript},
  {regex: /^application x-ar*$/, thumb: archive},
  {regex: /^application x-bittorrent*$/, thumb: bittorrent},
  {regex: /^application x-blender*$/, thumb: blender},
  {regex: /^application x-bzip*$/, thumb: bzip},
  {regex: /^application x-cd*$/, thumb: iso},
  {regex: /^application x-*tar*$/, thumb: tar},
  {regex: /^application x-deb*$/, thumb: deb},
  {regex: /^application x-designer*$/, thumb: designer},
  {regex: /^application x-desktop*$/, thumb: desktop},
  {regex: /^application x-executable*$/, thumb: executable},
  {regex: /^application x-font*$/, thumb: font},
  {regex: /^application x-gzip*$/, thumb: gzip},
  {regex: /^application x-java*$/, thumb: java},
  {regex: /^application x-java-archive*$/, thumb: jar},
  {regex: /^application x-javascript*$/, thumb: js},
  {regex: /^application x-krita*$/, thumb: krita},
  {regex: /^application x-lyx*$/, thumb: lyx},
  {regex: /^application x-macbinary*$/, thumb: macbin},
  {regex: /^application x-ms-dos-executable*$/, thumb: winbin},
  {regex: /^application x-ms-shortcut*$/, thumb: winshortcut},
  {regex: /^application x-mswinurl*$/, thumb: textHtml},
  {regex: /^application x-pem-key*$/, thumb: pemKey},
  {regex: /^application x-perl*$/, thumb: perl},
  {regex: /^application x-php*$/, thumb: php},
  {regex: /^application x-ruby*$/, thumb: ruby},
  {regex: /^application x-sharedlib*$/, thumb: sharedlib},
  {regex: /^application x-shockwave-flash*$/, thumb: flash},
  {regex: /^application zip*$/, thumb: zip},

  {regex: /^virtualbox-hdd*$/, thumb: vbHdd},
  {regex: /^virtualbox-ova*$/, thumb: vbOva},
  {regex: /^virtualbox-ovf*$/, thumb: vbOvf},
  {regex: /^virtualbox-vbox-extpack*$/, thumb: vbExtpack},
  {regex: /^virtualbox-vbox*$/, thumb: vbVbox},
  {regex: /^virtualbox-vdi*$/, thumb: vbVdi},
  {regex: /^virtualbox-vmdk*$/, thumb: vbVmdk},
]

const temp: any = function (mime: string): string {
  const mimeTest = mime.replace(/\//g, ' ') // replace forward slashes with spaces for convenience
  console.log("Matching mime", mime, mimeTest)
  for (const mapping of mappings) {
    if (mapping.regex.test(mimeTest)) {
      return mapping.thumb
    }
  }
  return other
}
temp.mappings = mappings

const mime2filename: {
  (mime: string): string
  mappings: {
    regex: RegExp
    thumb: string
  }[]
} = temp

export default mime2filename
