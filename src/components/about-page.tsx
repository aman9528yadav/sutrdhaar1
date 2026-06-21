"use client";

import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Rocket,
    Sparkles,
    Zap,
    CheckCircle,
    GitBranch,
    MessageSquare,
    Users,
    BookOpen,
    Shield,
    Mail,
    Flag,
    Icon as LucideIcon,
    Heart,
    Star,
    TrendingUp,
    Award,
    Target,
    Code,
    Palette,
    Cpu,
    Globe,
    Github,
    Twitter,
    Linkedin,
    ExternalLink,
    Clock,
    Activity,
} from 'lucide-react';
import { useChangelog } from '@/hooks/useChangelog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const roadmapIconMap: { [key: string]: React.ElementType } = {
    GitBranch,
    Sparkles,
};

const testimonials = [
    {
        quote: "This app is a lifesaver for my freelance work. The currency converter is always up-to-date, and the notes feature keeps everything in one place.",
        name: "Priya Sharma",
        location: "Mumbai",
        rating: 5
    },
    {
        quote: "As a student, I use the calculator and unit converter daily. It's fast, accurate, and the interface is clean and easy to use.",
        name: "Rohan Kumar",
        location: "Delhi",
        rating: 5
    },
    {
        quote: "The custom units feature is a game-changer for my niche projects. I can create my own conversions, saving me so much time.",
        name: "Anjali Gupta",
        location: "Bangalore",
        rating: 5
    },
];

const features = [
    {
        icon: Zap,
        title: "Lightning Fast",
        description: "Optimized performance for instant calculations"
    },
    {
        icon: Palette,
        title: "Beautiful Design",
        description: "Modern, clean interface that's easy on the eyes"
    },
    {
        icon: Cpu,
        title: "Smart Features",
        description: "Advanced tools for power users"
    },
    {
        icon: Globe,
        title: "Multi-Currency",
        description: "Real-time currency conversion"
    },
];

export function AboutPage() {
    const { version, aboutConfig } = useChangelog();
    
    const ownerInfo = { name: 'Aman Yadav' };
    const appInfo = { version: version || '1.0.0', license: 'MIT', channel: 'Stable' };
    const stats = {
        happyUsers: aboutConfig.happyUsers,
        calculationsDone: aboutConfig.calculationsDone,
        rating: aboutConfig.rating,
        uptime: aboutConfig.uptime
    };
    const roadmap = aboutConfig.roadmap;

    return (
        <div className="w-full space-y-12 pb-20">
            {/* Hero Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
            >
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                    <div className="relative p-6 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full border-2 border-emerald-500/20">
                        <Rocket className="h-16 w-16 text-emerald-500" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500">
                        Sutradhaar
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        A modern, smart, and elegant productivity suite that makes your calculations effortless.
                        Built with ❤️ by Aman Yadav.
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <Badge variant="secondary" className="px-4 py-2 text-sm">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            v{appInfo.version}
                        </Badge>
                        <Badge variant="outline" className="px-4 py-2 text-sm">
                            {appInfo.license}
                        </Badge>
                        <Badge variant="outline" className="px-4 py-2 text-sm">
                            {appInfo.channel}
                        </Badge>
                    </div>
                </div>
            </motion.section>

            {/* Stats Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-4"
            >
                <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <CardContent className="p-6 text-center">
                        <Users className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
                        <p className="text-4xl font-bold text-emerald-500">{stats.happyUsers}</p>
                        <p className="text-sm text-muted-foreground mt-2">Happy Users</p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
                    <CardContent className="p-6 text-center">
                        <TrendingUp className="h-10 w-10 mx-auto mb-3 text-cyan-500" />
                        <p className="text-4xl font-bold text-cyan-500">{stats.calculationsDone}</p>
                        <p className="text-sm text-muted-foreground mt-2">Calculations</p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                    <CardContent className="p-6 text-center">
                        <Award className="h-10 w-10 mx-auto mb-3 text-blue-500" />
                        <p className="text-4xl font-bold text-blue-500">{stats.rating}</p>
                        <p className="text-sm text-muted-foreground mt-2">Rating</p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                    <CardContent className="p-6 text-center">
                        <Target className="h-10 w-10 mx-auto mb-3 text-purple-500" />
                        <p className="text-4xl font-bold text-purple-500">{stats.uptime}</p>
                        <p className="text-sm text-muted-foreground mt-2">Uptime</p>
                    </CardContent>
                </Card>
            </motion.section>

            {/* Features Grid */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
            >
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-2">Why Choose Sutradhaar?</h2>
                    <p className="text-muted-foreground">Powerful features designed for productivity</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                        >
                            <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50">
                                <CardContent className="p-6 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 rounded-xl bg-primary/10">
                                            <feature.icon className="h-8 w-8 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* Roadmap Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
            >
                <div className="text-center">
                    <h2 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="h-6 w-6 text-pink-500" />
                        Roadmap & Updates
                    </h2>
                    <p className="text-muted-foreground">Our journey and what's coming next</p>
                </div>

                <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                    {roadmap.map((item, index) => {
                        const ItemIcon = roadmapIconMap[item.icon] || GitBranch;
                        return (
                            <AccordionItem value={`item-${index}`} key={item.id} className="border-b-0">
                                <div className="flex">
                                    <div className="flex flex-col items-center mr-4">
                                        <div>
                                            <div className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center",
                                                item.status === 'completed' ? "bg-emerald-500" : (item.status === 'in-progress' ? "bg-blue-500" : "bg-purple-500")
                                            )}>
                                                {item.status === 'completed' && <CheckCircle className="h-3 w-3 text-white" />}
                                                {item.status === 'in-progress' && <Activity className="h-3 w-3 text-white" />}
                                                {item.status === 'planned' && <Clock className="h-3 w-3 text-white" />}
                                            </div>
                                        </div>
                                        {index < roadmap.length - 1 && <div className="w-px h-full bg-border mt-2" />}
                                    </div>
                                    <div className="flex-1 pb-8">
                                        <AccordionTrigger className="w-full py-1 hover:no-underline">
                                            <div className="flex justify-between items-start w-full">
                                                <div className="text-left">
                                                    <p className="font-semibold text-lg">{item.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4 shrink-0">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "capitalize text-[10px] py-0",
                                                            item.status === 'completed' && "bg-emerald-500/10 text-emerald-700 border-emerald-500/50",
                                                            item.status === 'in-progress' && "bg-blue-500/10 text-blue-700 border-blue-500/50",
                                                            item.status === 'planned' && "bg-purple-500/10 text-purple-700 border-purple-500/50"
                                                        )}
                                                    >
                                                        {item.status.replace('-', ' ')}
                                                    </Badge>
                                                    <Badge
                                                        variant={item.status === 'completed' ? 'default' : 'secondary'}
                                                        className={cn(
                                                            item.status === 'completed' && "bg-emerald-500/10 text-emerald-700 border-emerald-500/50"
                                                        )}
                                                    >
                                                        {item.version}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4">
                                            <Card className="bg-muted/30">
                                                <CardContent className="p-4 space-y-3">
                                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                                    <ul className="text-sm space-y-2">
                                                        {item.details.map((detail, i) => (
                                                            <li key={i} className="flex items-start gap-2">
                                                                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                                                <span>{detail}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        </AccordionContent>
                                    </div>
                                </div>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </motion.section>

            {/* Testimonials */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-6"
            >
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-2">What Our Users Say</h2>
                    <p className="text-muted-foreground">Real feedback from real people</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testimonials.slice(0, 2).map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                        >
                            <Card className="h-full hover:shadow-lg transition-all">
                                <CardContent className="p-6 space-y-4 text-center">
                                    <div className="flex gap-1 justify-center">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground italic">"{testimonial.quote}"</p>
                                    <div className="flex flex-col items-center gap-3 pt-2 border-t">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{testimonial.name}</p>
                                            <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* Founder Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-6"
            >
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-2">Meet the Founder</h2>
                    <p className="text-muted-foreground">The mind behind Sutradhaar</p>
                </div>

                <Card className="overflow-hidden border-2">
                    <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 p-8">
                        <div className="flex flex-col items-center text-center space-y-6">
                            {/* Image First */}
                            <Avatar className="h-32 w-32 border-4 border-white/20 shadow-xl">
                                <AvatarImage src="/img/owner image.jpg" alt={ownerInfo.name} />
                                <AvatarFallback className="text-2xl">AY</AvatarFallback>
                            </Avatar>

                            {/* Name and Title */}
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">{ownerInfo.name}</h3>
                                <p className="text-muted-foreground">Founder & Lead Engineer</p>
                            </div>

                            {/* Description */}
                            <p className="text-sm leading-relaxed max-w-2xl">
                                "Hi, I'm Aman Yadav, the creator of Sutradhaar. My vision is to build a simple yet powerful productivity tool that helps people save time, focus better, and achieve more with ease. Every feature is crafted with care and attention to detail."
                            </p>

                            {/* Social Links */}
                            <div className="flex gap-3 justify-center flex-wrap">
                                <Button size="sm" variant="outline" className="gap-2">
                                    <Github className="h-4 w-4" />
                                    GitHub
                                </Button>
                                <Button size="sm" variant="outline" className="gap-2">
                                    <Twitter className="h-4 w-4" />
                                    Twitter
                                </Button>
                                <Button size="sm" variant="outline" className="gap-2">
                                    <Linkedin className="h-4 w-4" />
                                    LinkedIn
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.section>

            {/* Quick Links */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <Card className="hover:shadow-lg transition-all">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2 text-lg">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Resources
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="ghost" className="w-full justify-center" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Documentation
                        </Button>
                        <Button variant="ghost" className="w-full justify-center" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Updates & News
                        </Button>
                        <Button variant="ghost" className="w-full justify-center" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            How to Use
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2 text-lg">
                            <Shield className="h-5 w-5 text-primary" />
                            Legal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="ghost" className="w-full justify-center" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Terms of Service
                        </Button>
                        <Button variant="ghost" className="w-full justify-center" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Privacy Policy
                        </Button>
                        <Button variant="ghost" className="w-full justify-center" size="sm">
                            <Code className="h-4 w-4 mr-2" />
                            Open Source
                        </Button>
                    </CardContent>
                </Card>
            </motion.section>

            {/* Support Section - Full Width */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
            >
                <Card className="hover:shadow-lg transition-all">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2 text-lg">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Support
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-center"
                                size="sm"
                                onClick={() => window.open('https://aman9528.wixstudio.com/my-site-3/aman', '_blank', 'noopener,noreferrer')}
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Contact Us
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-center"
                                size="sm"
                                onClick={() => window.open('https://aman9528.wixstudio.com/my-site-3/aman', '_blank', 'noopener,noreferrer')}
                            >
                                <Flag className="h-4 w-4 mr-2" />
                                Report Issue
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-center"
                                size="sm"
                                onClick={() => window.open('https://aman9528.wixstudio.com/my-site-3/aman', '_blank', 'noopener,noreferrer')}
                            >
                                <Heart className="h-4 w-4 mr-2" />
                                Give Feedback
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.section>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center text-sm text-muted-foreground pt-8 border-t"
            >
                <p>Made with <Heart className="h-4 w-4 inline text-red-500 fill-current" /> by Aman Yadav</p>
                <p className="mt-1">© 2024 Sutradhaar. All rights reserved.</p>
            </motion.div>
        </div>
    );
}
