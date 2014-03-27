module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-compress');
  
  grunt.registerTask('default', ['jshint', 'compress']);
  
  grunt.initConfig({
    distdir: 'dist',
    pkg: grunt.file.readJSON('package.json'),
    src: {
      app: 'src',
      js: ['src/js/*.js']
    },
    jshint:{
      files:['GruntFile.js', '<%= src.js %>'],
      options:{
        curly:true,
        eqeqeq:true,
        immed:true,
        latedef:true,
        newcap:true,
        noarg:true,
        sub:true,
        boss:true,
        eqnull:true,
        globals:{}
      }
    },
    compress: {
      main: {
        options: {
          mode: 'zip',
          archive: '<%= distdir %>/package.nw'
        },
        files: [
          {src: ['**'], expand: true, cwd: '<%= src.app %>'}
        ]
      }
    }
  });
};