# RubyGems — Gem::Version.correct? + <=>. Usage: ruby oracle_ruby.rb < inputs.json
require 'json'; require 'rubygems'
vs = JSON.parse($stdin.read)['versions']
P = vs.map { |v| Gem::Version.correct?(v) ? Gem::Version.new(v) : nil }
cmp = P.map { |a| a && P.map { |b| b && (a <=> b) } }
puts JSON.generate({tool: "RubyGems #{Gem::VERSION}", canon: P.map { |a| a && a.to_s }, cmp: cmp})
