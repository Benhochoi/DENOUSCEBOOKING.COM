$root = Split-Path -Parent $PSScriptRoot
$templatePath = Join-Path $PSScriptRoot 'footer-template.html'
$template = [System.IO.File]::ReadAllText($templatePath, [System.Text.UTF8Encoding]::new($false))

function Build-Footer {
    param(
        [string]$HomeUrl,
        [string]$ContactUrl,
        [string]$AboutUrl,
        [string]$LogoUrl,
        [string]$CityHnUrl,
        [string]$CityHcmUrl,
        [string]$CityDnUrl,
        [string]$CityPqUrl,
        [string]$LogoAttrs = '',
        [string]$AboutAttrs = ''
    )

    $result = $template
    $result = $result.Replace('{{HOME}}', $HomeUrl)
    $result = $result.Replace('{{CONTACT}}', $ContactUrl)
    $result = $result.Replace('{{ABOUT}}', $AboutUrl)
    $result = $result.Replace('{{LOGO}}', $LogoUrl)
    $result = $result.Replace('{{CITY_HN}}', $CityHnUrl)
    $result = $result.Replace('{{CITY_HCM}}', $CityHcmUrl)
    $result = $result.Replace('{{CITY_DN}}', $CityDnUrl)
    $result = $result.Replace('{{CITY_PQ}}', $CityPqUrl)
    $result = $result.Replace('{{LOGO_ATTRS}}', $LogoAttrs)
    $result = $result.Replace('{{ABOUT_ATTRS}}', $AboutAttrs)
    return $result
}

$footerRegex = '(?s)<footer>.*?</footer>'
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$updated = 0

Get-ChildItem -Path $root -Recurse -Include *.html,*.htm | ForEach-Object {
    $rel = $_.FullName.Substring($root.Length + 1).Replace('\', '/')

    if ($rel -match '^pages/') {
        $footer = Build-Footer `
            -HomeUrl 'home.html' `
            -ContactUrl 'contact.html' `
            -AboutUrl 'about-us.html' `
            -LogoUrl '../images/logo.png' `
            -CityHnUrl '../cities/ha-noi.html' `
            -CityHcmUrl '../cities/ho-chi-minh.html' `
            -CityDnUrl '../cities/da-nang.html' `
            -CityPqUrl '../cities/phu-quoc.html' `
            -AboutAttrs ' id="about"'
    }
    elseif ($rel -match '^cities/') {
        $footer = Build-Footer `
            -HomeUrl '../pages/home.html' `
            -ContactUrl '../pages/contact.html' `
            -AboutUrl '../pages/about-us.html' `
            -LogoUrl '../images/logo.png' `
            -CityHnUrl 'ha-noi.html' `
            -CityHcmUrl 'ho-chi-minh.html' `
            -CityDnUrl 'da-nang.html' `
            -CityPqUrl 'phu-quoc.html' `
            -LogoAttrs ' id="contact"' `
            -AboutAttrs ' id="about"'
    }
    elseif ($rel -match '^hotels/') {
        $footer = Build-Footer `
            -HomeUrl '../../pages/home.html' `
            -ContactUrl '../../pages/contact.html' `
            -AboutUrl '../../pages/about-us.html' `
            -LogoUrl '../../images/logo.png' `
            -CityHnUrl '../../cities/ha-noi.html' `
            -CityHcmUrl '../../cities/ho-chi-minh.html' `
            -CityDnUrl '../../cities/da-nang.html' `
            -CityPqUrl '../../cities/phu-quoc.html'
    }
    else {
        return
    }

    $content = [System.IO.File]::ReadAllText($_.FullName, [System.Text.UTF8Encoding]::new($false))
    $orig = $content

    if ($content -match '<footer>') {
        $content = [regex]::Replace($content, $footerRegex, $footer)
    }
    elseif ($rel -eq 'pages/all-hotels.html' -and $content -match '</main>') {
        $content = $content -replace '</main>', "</main>`n`n$footer"
    }
    else {
        return
    }

    if ($content -ne $orig) {
        [System.IO.File]::WriteAllText($_.FullName, $content, $utf8NoBom)
        $updated++
        Write-Output $rel
    }
}

Write-Output "Synced $updated files"
