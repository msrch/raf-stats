module.exports = function(grunt) {

    // Grunt configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        
        src_file: 'src/raf-stats.js',

        banner: '/*!\n' +
                ' * <%= pkg.name %> v<%= pkg.version %>\n' +
                ' * <%= pkg.description %>\n' +
                ' * <%= pkg.repository.url %>\n' +
                ' * (c) <%= grunt.template.today("yyyy") %> <%= pkg.copyright %>, License <%= pkg.license %>\n' +
                ' */\n',

        clean: {
            build: ['build/*']
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            src: ['<%= src_file %>']
        },

        uglify: {
            options: {
                banner: '<%= banner %>',
                report: 'gzip'
            },
            build: {
                files: {
                    'build/raf-stats.min.js': ['<%= src_file %>']
                }
            }
        },

        watch: {
            files: ['<%= src_file %>'],
            tasks: ['build']
        }

    });

    // Load plugins.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Register task(s).
    grunt.registerTask('default', 'Default task - build and watch.', ['build', 'watch']);
    grunt.registerTask('build', 'Build task.', ['jshint', 'clean', 'uglify']);
};