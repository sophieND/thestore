var fs = require('fs');
module.exports = function(grunt) {
    //load npmtask
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-jsonmin');
    grunt.loadNpmTasks('grunt-contrib-concat-sourcemaps');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-aws');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');

    //configure task
    grunt.initConfig({
       srcjsFiles: ['src/js/**/*.js'],
       testjsFiles: ['tests/**/*.js'],
       srchtmlFiles: ['src/**/*.html'],
       srccssFiles: ['src/css/**/*.css'],
       concat: {
           build: {
               dest: 'build/js/thestore.min.js',
               src: '<%= srcjsFiles %>'
           }
       },
       processhtml: {
           build: {
               files: {'build/index.html': ['src/index.html']}
           }
       },
       jsonmin: {
           data: {
               files: [ {expand: true, cwd: 'src/data', src: ['**/*.json'], dest: 'build/data/'} ]
           }
       },
       cssmin: {
           thestore: {
               files: {
                   'build/css/thestore.min.css': ['<%= srccssFiles %>']
               }
           }
       },
       htmlmin: {
           options: {
                removeComments: true,
                collapseWhitespace: true,
                collapseBooleanAttributes: true,
                removeAttributeQuotes: true,
                removeRedundantAttributes: true,
                removeOptionalTags: true,
                minifyJS: true,
                minifyCSS: true
           },
           allhtml: {
                expand: true,
                cwd: 'src/',
                src: ['**/*.html', '!index.html'],
                dest: 'build/'
           },
           index: {
               files: {'build/index.html': 'build/index.html'}
           }
       },
       imagemin: {
           images: {
               files: [
                   {
                    expand: true,
                    cwd: 'src',
                    src: ['**/*.{png,jpg,gif}'],
                    dest: 'build/'
                   }
               ]
           }
       },
       copy: {
           vendor: {
               files: [
                   {
                    expand:true, 
                    cwd: 'src/vendor',
                    src: ['**/*.{js,css,map}', '**/dist/fonts/*'], 
                    dest: 'build/vendor/'
                   }
               ]
           },
           images: {
               files: [
                   {
                       expand:true,
                       cwd: 'src/images',
                       src: ['**/*'],
                       dest: 'build/images/'
                   }
               ]
           },
           favicon: {
               dest: 'build/favicon.ico',
               src: 'src/favicon.ico'
           }
       },
       jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            src: ['<%= srcjsFiles %>'],
            tests: ['<%= testjsFiles %>']
       },
       uglify: {
           options: {
               mangle: true,
               preserveComments: false,
               compress: {drop_console: true}
           },
           js: {
               files: {'<%= concat.build.dest %>': ['<%= concat.build.dest %>']}
           }
       },
       clean: {
           build: ["build"]
       },
       aws: (grunt.file.exists('../aws.json')) ? grunt.file.readJSON('../aws.json') : null,
       s3: {
           options: {
               accessKeyId: '<%= aws.accessKeyId %>',
               secretAccessKey: '<%= aws.secretAccessKey %>',
               bucket: 'gostore'
           },
           build: {
               cwd: 'build/',
               src: '**'
           }
       },
        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true,
                    base: 'src'
                }
            },
            build: {
                options: {
                    open: true,
                    base: 'build'
                }
            },
            src: {
                options: {
                    open: true,
                    base: 'src'
                }
            }
        },
       watch: {
           srcjs: {
               files: '<%= srcjsFiles %>',
               tasks: ["jshint:src"]
           },
           livereload: {
               options: {
                   livereload: '<%= connect.options.livereload %>'
               },
               files: [
                   '<%= srcjsFiles %>',
                   '<%= srchtmlFiles %>',
                   '<%= srccssFiles %>'
               ]
           }
       }
    });
    
    grunt.registerTask('log-build', function() {
        this.requires('clean:build');
        this.requires('concat');
        this.requires('processhtml');
        this.requires('jsonmin');
        this.requires('cssmin');
        this.requires('htmlmin');
        this.requires('copy');
        this.requires('lintjs');
        this.requires('uglify');
        var message = 'Built on ' + new Date();
        fs.appendFileSync('build.log', message + '\n');
        grunt.log.writeln(message);
    });
    
    // makes jshint optional
    grunt.registerTask('lintjs', function() {
        if (grunt.file.exists('.jshintrc')) {
            grunt.task.run('jshint:src');
        }
        else {
            grunt.log.writeln("Warning: .jshintrc file not found. Javascript not linted!");
        }
    });

    grunt.registerTask('log-deployAWS', function() {
        var message = 'Deployed on ' + new Date();
        fs.appendFileSync('deployAWS.log', message + '\n');
        grunt.log.writeln(message);
    });

    grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
        if (target === 'build') {
            return grunt.task.run(['build', 'connect:build:keepalive']);
        }

        grunt.task.run([
            'connect:livereload',
            'watch'
        ]);
    });


    grunt.registerTask('build', ['clean', 'concat', 'processhtml', 'jsonmin', 'cssmin', 'htmlmin', 'copy', 'lintjs', 'uglify', 'log-build']);
    grunt.registerTask('default', 'build');
    grunt.registerTask('deployAWS', ['s3', 'log-deployAWS']);
    
};