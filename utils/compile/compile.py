#!/usr/bin/env python

import sys
import os
import re
import shutil

# ----- CONFIG AREA ---------------------------------------

compileLevel = ' --compilation_level WHITESPACE_ONLY';
compileLevel = ' --compilation_level ADVANCED_OPTIMIZATIONS'
deploy = False
useExterns = True

if len( sys.argv ) > 1 :	
	if sys.argv[1] == 'advanced' :
		compileLevel = ' --compilation_level ADVANCED_OPTIMIZATIONS'
	if len( sys.argv ) > 2 :	
		if sys.argv[2] == 'deploy' :
			deploy = True

# SRC FILE TO SCAN
src_path = '../../src/html/'
src_pages = ['index.php'] #, 'index.php', 'editor.html', 'teaser.html'
src_js_filenames = ['main.js'] #,'main.js', 'editor.js', 'teaser.js'
deploy_path = '../../deploy/public/'
js_path = '../../src/include/js/'


# FILES TO COPY TO DEPLOY
deploy_files = []
deploy_files.append( 'assets/' )

# ----- END CONFIG AREA -------


# ---------- COMPILER -------------------------------------

print 'Scanning HTML file...'

for i in range(len(src_pages)) :

	page = src_pages[i]
	js_filename = src_js_filenames[i]
	src = src_path + page
	src_file = open( src,'r' )
	string = src_file.read()
	src_file.close()

	print 'Extracting JS files...'

	# GRAB ALL JS SRC ATTRIBUTES
	s = re.findall( '<script[^>]* src=\"([^\"]*)\"[^>]*></script>', string )

	# CREATE CLOSURE MULTIPLE FILE IINPUT

	comile_files = []
	third_party_files = []

	for item in s :
		if re.match( '../include/js/', item ) :
			# WE WANT THIS ONE
			if useExterns and re.match( '../include/js/libs/third-party/', item ) :
				third_party_files.append( item.replace( '../', '../../src/', 1 ) );
			else:
				comile_files.append( item.replace( '../', '../../src/', 1 ) );


	print 'Found ' + str( len( comile_files ) ) + ' JS files'

	# CALCULATE DEPENDENCIES

	print 'Calculating dependencies...'
	os.system( 'python calcdeps.py -i ../../src/include/js/ -p ../../src/include/closure/ > dependencies.txt' )

	# ADD GOOG LIBS TO PROJECT
	code = '';
	goog = []

	print 'Adding GOOG libraries to project...'

	gtmp = open( 'dependencies.txt' )
	gs = gtmp.read()
	gtmp.close()

	a = gs.split( '\n' )

	for d in a :
		if d.find( '/closure/goog/' ) > -1 :
			print 'Adding ' + d
			goog.append( d )

	# Delete dependencies buffer
	os.system( 'rm dependencies.txt' );

	# ADD JS GOOG FLAGS

	for g in goog :
		code += ' --js=' + g

	print 'Found ' + str( len( goog ) ) + ' GOOG libraries.'

	# ADD REST OF JS FLAGS

	print 'Adding ' + str( len( comile_files ) ) + ' JS Files to project...'


	for f in comile_files :
		code += ' --js=' + f

	# ADD EXTERNS
	if useExterns:
		code += ' --externs ../../src/include/js/libs/externs.js'

	code += compileLevel

	# CALL THE COMPILER

	print "Compiling..."

	os.system( "java -jar compiler.jar " + code + " --language_in=ECMASCRIPT5 --js_output_file=" + js_filename )

	# ------- END COMPILER --------


	print 'Generating index.php...'

	head = string.split( '<!-- COMPILE -->' )
	foot = string.split( '<!-- END COMPILE -->' )

	ifile = open( deploy_path + page, 'w' );
	ifile.write( head[0] )

	# ADD THIRD PARTY INCLUDES
	if len(third_party_files) > 0:
		for item_path in third_party_files :
			file_name = item_path.replace('../../src/include/js/libs/third-party/', '', 1)
			ifile.write( '<script type="text/javascript" src="<?php echo $assetsPath; ?>js/libs/' + file_name + '" charset="utf-8"></script>\n\t' )

	ifile.write( '<script type="text/javascript" src="<?php echo $assetsPath; ?>js/' + js_filename + '" charset="utf-8"></script>' )
	ifile.write( foot[1] );
	ifile.close()

# ----------------- DEPLOY ------------------------

# COPY FILES TO DEPLOY
print 'Cleaning up CSS and Image Folders...'
os.system( "rm -r " + deploy_path + 'assets/css/' )
os.system( "rm -r " + deploy_path + 'assets/images/' )

print 'Copying Files to Deploy...'
os.system( "mkdir " + deploy_path )
os.system( "mkdir " + deploy_path + 'assets')
os.system( "mkdir " + deploy_path + 'assets/js')

for df in deploy_files :
	print 'Copying ' + df
	os.system( "rsync -av --exclude=.svn --exclude=.DS_Store " + src_path + df + " " + deploy_path + df )

print 'Deleting Unnecessary Files...'
os.system( "rm -r " + deploy_path + 'assets/scss' )
os.system( "rm -r " + deploy_path + 'assets/.sass-cache' )
os.system( "rm -r " + deploy_path + 'assets/config.rb' )
os.system( "rm -r " + deploy_path + 'assets/images/icon' )

print 'Compiling index.php...'
os.system( "php " + deploy_path + 'index.php > ' + deploy_path + 'index.html' )


print 'Moving compressed JS file...'
for js in src_js_filenames :
	os.system( "mv " + js + " " + deploy_path + 'assets/js/' + js )

if len(third_party_files) > 0 and useExterns:
	print 'Moving ' + str(len(third_party_files)) + ' third-party JS files...'
	os.system( "rm -r " + deploy_path + 'assets/js/libs')
	os.system( "mkdir " + deploy_path + 'assets/js/libs')
	
	os.system( "rsync -av --exclude=.svn --exclude=.DS_Store " + js_path + 'libs/third-party/' + " " + deploy_path + 'assets/js/libs/' )

print 'Moving htaccess files.'
shutil.copyfile(src_path + '.htaccess', deploy_path + '.htaccess');
shutil.copyfile(src_path + '.htpasswd', deploy_path + '.htpasswd');
	
print 'Done. Now deployed.'
